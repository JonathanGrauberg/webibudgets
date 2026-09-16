//lib\dashboard-store.ts
import { prisma } from '@/lib/prisma'
import type { ProductCategory, BudgetStatus } from '@prisma/client' // 👈 nuevo
import { isReceiptActive } from '@/lib/collected-amount'

// Estados de presupuesto donde el cobro es una expectativa REAL, no una
// suposición — un 'sent' todavía no lo aprobó el cliente, así que contarlo
// en "Por Cobrar" da a entender que todo lo enviado se aprueba y se cobra,
// que no es el caso. Solo 'approved' y 'completed' son negocio confirmado.
const PAYABLE_STATUSES: BudgetStatus[] = ['approved', 'completed']

export interface DashboardStats {
  totalClients: number
  totalProducts: number
  totalBudgets: number
  approvedBudgets: number
  pendingBudgets: number
  rejectedBudgets: number
  totalRevenue: number
}

export interface RecentBudget {
  id: string
  total: number
  status: string
  createdAt: Date
  client: {
    name: string | null
    company: string | null
  } | null
  items: {
    id: string
  }[]
}

export async function getDashboardStats(
  tenantId: string,
  range?: { from: Date; to: Date } // 👈 nuevo, opcional
): Promise<DashboardStats> {
  const dateFilter = range ? { createdAt: { gte: range.from, lte: range.to } } : {}

  const totalClients = await prisma.client.count({ where: { tenantId } }) // 👈 sin filtro, a propósito
  const totalProducts = await prisma.productService.count({
    where: { tenantId, active: true },
  }) // 👈 sin filtro, a propósito

  // 👇 un presupuesto desactivado se maneja como si estuviera borrado — no
  // debe influir en ningún número del dashboard, solo vuelve a contar si se reactiva.
  const totalBudgets = await prisma.budget.count({ where: { tenantId, active: true, ...dateFilter } })
  const approvedBudgets = await prisma.budget.count({
    where: { tenantId, active: true, status: 'approved', ...dateFilter },
  })
  const draftBudgets = await prisma.budget.count({
    where: { tenantId, active: true, status: 'draft', ...dateFilter },
  })
  const sentBudgets = await prisma.budget.count({
    where: { tenantId, active: true, status: 'sent', ...dateFilter },
  })
  const rejectedBudgets = await prisma.budget.count({
    where: { tenantId, active: true, status: 'rejected', ...dateFilter },
  })

  const approvedRevenue = await prisma.budget.aggregate({
    where: { tenantId, active: true, status: 'approved', ...dateFilter },
    _sum: { total: true },
  })

  return {
    totalClients,
    totalProducts,
    totalBudgets,
    approvedBudgets,
    pendingBudgets: draftBudgets + sentBudgets,
    rejectedBudgets,
    totalRevenue: approvedRevenue._sum.total || 0,
  }
}

export interface CollectedStats {
  totalCollected: number      // plata que entró de verdad (recibos + MP)
  totalPending: number        // lo que falta cobrar de lo ya aprobado/enviado
  totalApprovedValue: number  // "si se cobrara todo" — el número viejo, ahora secundario
}

// 👇 nuevo — a diferencia de totalRevenue (arriba), esto SÍ resta lo que ya
// se cobró. totalRevenue mezclaba "lo que valen los presupuestos aprobados"
// con "lo que entró de verdad", que dejaron de ser lo mismo apenas existió
// el cobro parcial online.
//
// 👇 "Cobrado" y "Por Cobrar" tienen naturalezas distintas y no deben
// depender del mismo filtro de fecha de la misma forma:
// - "Cobrado" es un FLUJO — tiene sentido que respete el período elegido
//   arriba (Este mes/Este año/Histórico). Antes ignoraba `range` del todo,
//   por eso "Cobrado" con "Este mes" seleccionado mostraba plata que en
//   realidad había entrado en meses anteriores.
// - "Por Cobrar" es un SALDO (como una cuenta corriente) — lo que falta
//   cobrar HOY no depende de qué mes estés mirando, así que se calcula
//   siempre con el histórico completo, sin importar `range`.
export async function getCollectedStats(
  tenantId: string,
  range?: { from: Date; to: Date }
): Promise<CollectedStats> {
  const budgets = await prisma.budget.findMany({
    where: { tenantId, active: true, status: { in: PAYABLE_STATUSES } },
    select: { id: true, total: true },
  })
  const budgetIds = budgets.map((b) => b.id)

  const [receipts, payments, linkedCobros, standaloneCobros] = await Promise.all([
    prisma.receipt.findMany({
      where: { budgetId: { in: budgetIds }, sourceBudgetPaymentId: null },
      select: { budgetId: true, amount: true, status: true, issueDate: true },
    }),
    prisma.budgetPayment.findMany({
      where: { budgetId: { in: budgetIds }, status: 'approved' },
      select: { budgetId: true, amount: true, createdAt: true },
    }),
    prisma.cobro.findMany({
      where: { budgetId: { in: budgetIds }, status: 'paid' },
      select: { budgetId: true, amount: true, paidAt: true },
    }),
    prisma.cobro.findMany({
      where: { tenantId, budgetId: null },
      select: { amount: true, status: true, paidAt: true },
    }),
  ])

  const inRange = (d: Date | null) => !range || (d != null && d >= range.from && d <= range.to)
  const add = (map: Map<string, number>, id: string | null, amount: number) => {
    if (!id) return
    map.set(id, (map.get(id) ?? 0) + amount)
  }

  // Dos mapas por presupuesto: todo lo cobrado alguna vez (para el saldo
  // pendiente real) y solo lo cobrado dentro del período elegido (para
  // mostrar "Cobrado").
  const collectedAllTimeByBudget = new Map<string, number>()
  const collectedInRangeByBudget = new Map<string, number>()

  for (const r of receipts) {
    if (!isReceiptActive(r.status)) continue
    const amount = Number(r.amount || 0)
    add(collectedAllTimeByBudget, r.budgetId, amount)
    if (inRange(r.issueDate)) add(collectedInRangeByBudget, r.budgetId, amount)
  }
  for (const p of payments) {
    const amount = Number(p.amount || 0)
    add(collectedAllTimeByBudget, p.budgetId, amount)
    if (inRange(p.createdAt)) add(collectedInRangeByBudget, p.budgetId, amount)
  }
  for (const c of linkedCobros) {
    const amount = Number(c.amount || 0)
    add(collectedAllTimeByBudget, c.budgetId, amount)
    if (inRange(c.paidAt)) add(collectedInRangeByBudget, c.budgetId, amount)
  }

  let totalCollected = 0 // dentro del período elegido — esto es lo que se muestra
  let totalCollectedAllTime = 0 // histórico completo — solo para calcular el saldo pendiente real
  let totalApprovedValue = 0
  for (const b of budgets) {
    totalApprovedValue += b.total
    // Math.min por las dudas — si alguien pagó de más por error, no
    // queremos mostrar "cobrado" mayor a lo presupuestado.
    totalCollectedAllTime += Math.min(collectedAllTimeByBudget.get(b.id) ?? 0, b.total)
    totalCollected += Math.min(collectedInRangeByBudget.get(b.id) ?? 0, b.total)
  }

  // 👇 Cobros del módulo "Cobros" que NO están vinculados a ningún
  // presupuesto (ej: una cuota mensual suelta) eran invisibles para estas
  // cuentas — "Cobrado"/"Por Cobrar" solo miraban Documentos. Un Cobro
  // vinculado a un presupuesto no se suma acá de nuevo (ya está arriba), y
  // si está pendiente ya forma parte del saldo pendiente de ESE
  // presupuesto — acá solo entran los sueltos.
  for (const c of standaloneCobros) {
    totalApprovedValue += c.amount
    if (c.status === 'paid') {
      totalCollectedAllTime += c.amount
      if (inRange(c.paidAt)) totalCollected += c.amount
    }
  }

  return {
    totalCollected,
    totalApprovedValue,
    totalPending: Math.max(totalApprovedValue - totalCollectedAllTime, 0),
  }
}

export async function getRecentBudgets(
  tenantId: string,
  limit = 5
): Promise<RecentBudget[]> {
  const budgets = await prisma.budget.findMany({
    where: { tenantId, active: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          name: true,
          company: true,
        },
      },
      items: {
        select: {
          id: true,
        },
      },
    },
  })

  return budgets.map((b) => ({
    id: b.id,
    total: b.total,
    status: b.status,
    createdAt: b.createdAt,
    client: b.client
      ? {
          name: b.client.name ?? null,
          company: b.client.company ?? null,
        }
      : null,
    items: b.items.map((item) => ({
      id: item.id,
    })),
  }))
}

export async function getMonthlyRevenue(tenantId: string) {
  const approved = await prisma.budget.findMany({
    where: { tenantId, active: true, status: 'approved' },
    select: {
      total: true,
      createdAt: true,
    },
  })

  const map = new Map<string, number>()

  approved.forEach((b) => {
    const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + b.total)
  })

  return Array.from(map.entries()).map(([month, total]) => ({
    month,
    total,
  }))
}

export interface BudgetStatusCount {
  status: string
  count: number
}

export async function getBudgetStatusStats(tenantId: string): Promise<BudgetStatusCount[]> {
  const grouped = await prisma.budget.groupBy({
    by: ['status'],
    where: { tenantId, active: true },
    _count: { status: true },
  })

  return grouped.map((g) => ({
    status: g.status,
    count: g._count.status,
  }))
}

export interface TopClient {
  clientId: string
  name: string
  company: string | null
  totalRevenue: number // suma de total en presupuestos Aprobados + Completados
  budgetCount: number
}

// "Mejor cliente" = el que más facturación generó en presupuestos ya
// cerrados (Aprobados + Completados) — mismo criterio que el filtro por
// defecto de la página de Presupuestos, no cantidad de presupuestos.
export async function getTopClients(tenantId: string, limit = 5): Promise<TopClient[]> {
  const grouped = await prisma.budget.groupBy({
    by: ['clientId'],
    where: { tenantId, active: true, status: { in: ['approved', 'completed'] } },
    _sum: { total: true },
    _count: { clientId: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limit,
  })

  const clientIds = grouped.map((g) => g.clientId)
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true, company: true },
  })
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  return grouped
    .map((g) => {
      const client = clientMap.get(g.clientId)
      if (!client) return null
      return {
        clientId: client.id,
        name: client.name,
        company: client.company,
        totalRevenue: g._sum.total ?? 0,
        budgetCount: g._count.clientId,
      }
    })
    .filter((x): x is TopClient => x !== null)
}

export interface RecentCobro {
  id: string
  concept: string
  amount: number
  currency: string
  status: string
  periodMonth: Date
  client: { name: string | null; company: string | null } | null
}

export interface RecentGasto {
  id: string
  description: string
  amount: number
  currency: string
  date: Date
  categoryName: string | null
}

export interface RecentDocumentoCobro {
  id: string
  clientName: string | null
  amount: number
  currency: string
  date: Date
  source: 'receipt' | 'mercado_pago'
}

export interface CobrosGastosSummary {
  cobros: {
    recent: RecentCobro[]
    totalCobrado: number  // cobros con status=paid, paidAt dentro del período elegido
    totalPendiente: number // cobros pending, periodMonth dentro del período elegido
  }
  gastos: {
    recent: RecentGasto[]
    total: number // suma de todos los gastos (generales + por trabajo) con date dentro del período elegido
  }
  // 👇 nuevo — lo cobrado vía Documentos (recibos manuales + Mercado Pago),
  // mismo criterio que ya usa la pantalla de Documentos ("Cobrado (recibos + Mercado Pago)")
  documentos: {
    recent: RecentDocumentoCobro[]
    total: number
  }
}

// 👇 nuevo — "mostrar los recientes y lo que suman según el período
// seleccionado": los "recientes" son siempre los últimos 5 (mismo criterio
// que Presupuestos Recientes, no depende del selector de período), los
// totales sí respetan el rango elegido en el dashboard.
export async function getCobrosGastosSummary(
  tenantId: string,
  range?: { from: Date; to: Date }
): Promise<CobrosGastosSummary> {
  const [recentCobros, paidInRange, pendingInRange, recentGastos, gastosInRange, recentReceipts, receiptsInRange] = await Promise.all([
    prisma.cobro.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true, company: true } } },
    }),
    prisma.cobro.aggregate({
      where: {
        tenantId,
        status: 'paid',
        ...(range ? { paidAt: { gte: range.from, lte: range.to } } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.cobro.aggregate({
      where: {
        tenantId,
        status: 'pending',
        // 👇 periodMonth siempre se guarda como el día 1 del mes en UTC puro
        // (ver lib/cobro-period.ts) — comparar contra `range.from` tal cual
        // (medianoche LOCAL, ej. 00:00 ART = 03:00 UTC) lo dejaba afuera del
        // "gte", porque 00:00 UTC del día 1 es "menor" que esas 03:00 UTC.
        // Hay que redondear `range.from` para abajo, al inicio UTC de su mes.
        ...(range
          ? { periodMonth: { gte: new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1)), lte: range.to } }
          : {}),
      },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { date: 'desc' },
      include: { category: { select: { name: true } } },
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        ...(range ? { date: { gte: range.from, lte: range.to } } : {}),
      },
      _sum: { amount: true },
    }),
    // 👇 nuevo — "Documentos" = lo cobrado vía recibos (Receipt), sin mezclar
    // con Cobros ni Mercado Pago — es específicamente lo que pidió Jonathan.
    prisma.receipt.findMany({
      where: { tenantId, sourceBudgetPaymentId: null },
      take: 5,
      orderBy: { issueDate: 'desc' },
      select: {
        id: true, amount: true, currency: true, issueDate: true, status: true,
        client: { select: { name: true, company: true } },
        budget: { select: { client: { select: { name: true, company: true } } } },
      },
    }),
    prisma.receipt.findMany({
      where: {
        tenantId,
        sourceBudgetPaymentId: null,
        ...(range ? { issueDate: { gte: range.from, lte: range.to } } : {}),
      },
      select: { amount: true, status: true },
    }),
  ])

  const documentosTotal = receiptsInRange
    .filter((r) => isReceiptActive(r.status))
    .reduce((acc, r) => acc + Number(r.amount || 0), 0)

  return {
    cobros: {
      recent: recentCobros.map((c) => ({
        id: c.id,
        concept: c.concept,
        amount: c.amount,
        currency: c.currency,
        status: c.status,
        periodMonth: c.periodMonth,
        client: c.client ? { name: c.client.name ?? null, company: c.client.company ?? null } : null,
      })),
      totalCobrado: paidInRange._sum.amount ?? 0,
      totalPendiente: pendingInRange._sum.amount ?? 0,
    },
    gastos: {
      recent: recentGastos.map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        currency: e.currency,
        date: e.date,
        categoryName: e.category?.name ?? null,
      })),
      total: gastosInRange._sum.amount ?? 0,
    },
    documentos: {
      recent: recentReceipts
        .filter((r) => isReceiptActive(r.status))
        .map((r) => ({
          id: r.id,
          clientName: r.client?.company || r.client?.name || r.budget?.client?.company || r.budget?.client?.name || null,
          amount: r.amount,
          currency: r.currency,
          date: r.issueDate,
          source: 'receipt' as const,
        })),
      total: documentosTotal,
    },
  }
}

export interface DailyCashflow {
  date: string // 'YYYY-MM-DD'
  cobrado: number // Cobros pagados (módulo "Cobros"), por día de pago — mismo criterio que la card "Cobros"
  recibos: number // Recibos activos (Documentos), por día de emisión — mismo criterio que la card "Documentos"
  gastado: number // Expenses, por día del gasto — mismo criterio que la card "Gastos"
}

const DAILY_CASHFLOW_WINDOW_DAYS = 30

// 👇 nuevo — antes era por mes; pasado a día para que se puedan ver patrones
// dentro del mes (ej: "los días 1 y 15 se concentran los gastos") — un
// resumen mensual aplana justo esa información. Últimos 30 días, no todo el
// histórico día por día (esto no es un ERP contable).
export async function getDailyCashflow(tenantId: string): Promise<DailyCashflow[]> {
  const since = new Date()
  since.setDate(since.getDate() - (DAILY_CASHFLOW_WINDOW_DAYS - 1))
  since.setHours(0, 0, 0, 0)

  const [cobros, receipts, gastos] = await Promise.all([
    prisma.cobro.findMany({
      where: { tenantId, status: 'paid', paidAt: { gte: since } },
      select: { amount: true, paidAt: true },
    }),
    prisma.receipt.findMany({
      where: { tenantId, sourceBudgetPaymentId: null, issueDate: { gte: since } },
      select: { amount: true, status: true, issueDate: true },
    }),
    prisma.expense.findMany({
      where: { tenantId, date: { gte: since } },
      select: { amount: true, date: true },
    }),
  ])

  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const map = new Map<string, { cobrado: number; recibos: number; gastado: number }>()

  // Pre-sembramos todos los días del rango en $0 — si no, un día sin
  // movimientos simplemente no aparecería en el gráfico, dejando un hueco
  // en vez de mostrar la caída a cero.
  for (let i = 0; i < DAILY_CASHFLOW_WINDOW_DAYS; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    map.set(dayKey(d), { cobrado: 0, recibos: 0, gastado: 0 })
  }

  cobros.forEach((c) => {
    if (!c.paidAt) return
    const key = dayKey(c.paidAt)
    const cur = map.get(key) ?? { cobrado: 0, recibos: 0, gastado: 0 }
    cur.cobrado += Number(c.amount || 0)
    map.set(key, cur)
  })

  receipts.forEach((r) => {
    if (!isReceiptActive(r.status)) return
    const key = dayKey(r.issueDate)
    const cur = map.get(key) ?? { cobrado: 0, recibos: 0, gastado: 0 }
    cur.recibos += Number(r.amount || 0)
    map.set(key, cur)
  })

  gastos.forEach((e) => {
    const key = dayKey(e.date)
    const cur = map.get(key) ?? { cobrado: 0, recibos: 0, gastado: 0 }
    cur.gastado += Number(e.amount || 0)
    map.set(key, cur)
  })

  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface TopRequestedProduct {
  productServiceId: string
  name: string
  unit: string
  category: ProductCategory // 👈 antes: string
  requestCount: number // en cuántos presupuestos distintos apareció
}

export async function getTopRequestedProducts(
  tenantId: string,
  limit = 6
): Promise<TopRequestedProduct[]> {
  const grouped = await prisma.budgetItem.groupBy({
    by: ['productServiceId'],
    where: {
      productServiceId: { not: null },
      budget: { tenantId, active: true },
    },
    _count: { productServiceId: true },
    orderBy: { _count: { productServiceId: 'desc' } },
    take: limit,
  })

  const productIds = grouped
    .map((g) => g.productServiceId)
    .filter((id): id is string => id !== null)

  const products = await prisma.productService.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unit: true, category: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return grouped
    .map((g) => {
      const product = g.productServiceId ? productMap.get(g.productServiceId) : undefined
      if (!product) return null
      return {
        productServiceId: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category,
        requestCount: g._count.productServiceId,
      }
    })
    .filter((x): x is TopRequestedProduct => x !== null)
}