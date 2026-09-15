//lib\dashboard-store.ts
import { prisma } from '@/lib/prisma'
import type { ProductCategory, BudgetStatus } from '@prisma/client' // 👈 nuevo
import { getCollectedByBudgetIds, isReceiptActive } from '@/lib/collected-amount'

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
export async function getCollectedStats(tenantId: string): Promise<CollectedStats> {
  const budgets = await prisma.budget.findMany({
    where: { tenantId, active: true, status: { in: PAYABLE_STATUSES } },
    select: { id: true, total: true },
  })

  const collectedByBudget = await getCollectedByBudgetIds(budgets.map((b) => b.id))

  let totalCollected = 0
  let totalApprovedValue = 0
  for (const b of budgets) {
    totalApprovedValue += b.total
    // Math.min por las dudas — si alguien pagó de más por error, no
    // queremos mostrar "cobrado" mayor a lo presupuestado.
    totalCollected += Math.min(collectedByBudget.get(b.id) ?? 0, b.total)
  }

  return {
    totalCollected,
    totalApprovedValue,
    totalPending: Math.max(totalApprovedValue - totalCollected, 0),
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
}

// 👇 nuevo — "mostrar los recientes y lo que suman según el período
// seleccionado": los "recientes" son siempre los últimos 5 (mismo criterio
// que Presupuestos Recientes, no depende del selector de período), los
// totales sí respetan el rango elegido en el dashboard.
export async function getCobrosGastosSummary(
  tenantId: string,
  range?: { from: Date; to: Date }
): Promise<CobrosGastosSummary> {
  const [recentCobros, paidInRange, pendingInRange, recentGastos, gastosInRange] = await Promise.all([
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
        ...(range ? { periodMonth: { gte: range.from, lte: range.to } } : {}),
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
  ])

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
  }
}

export interface MonthlyCashflow {
  month: string // 'YYYY-MM'
  cobrado: number // Cobros pagados (status=paid), por mes de pago
  gastado: number // Expenses, por mes de la fecha del gasto
}

// 👇 nuevo — evolución mensual de plata entrando (Cobros pagados) vs
// saliendo (Gastos), para el gráfico de líneas de Business Intelligence.
export async function getMonthlyCashflow(tenantId: string): Promise<MonthlyCashflow[]> {
  // 👇 "cobrado" tiene que salir de las TRES fuentes de plata real — antes
  // este gráfico solo miraba Cobros del módulo "Cobros" y por eso a la
  // mayoría de los tenants (que cobran con recibos manuales o Mercado
  // Pago, no con el módulo Cobros) el gráfico les salía casi vacío. Mismo
  // criterio que lib/collected-amount.ts en todos lados.
  const [receipts, payments, cobros, gastos] = await Promise.all([
    prisma.receipt.findMany({
      where: { tenantId, sourceBudgetPaymentId: null },
      select: { amount: true, status: true, issueDate: true },
    }),
    prisma.budgetPayment.findMany({
      where: { tenantId, status: 'approved' },
      select: { amount: true, createdAt: true },
    }),
    prisma.cobro.findMany({
      where: { tenantId, status: 'paid', paidAt: { not: null } },
      select: { amount: true, paidAt: true },
    }),
    prisma.expense.findMany({
      where: { tenantId },
      select: { amount: true, date: true },
    }),
  ])

  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const map = new Map<string, { cobrado: number; gastado: number }>()

  receipts.forEach((r) => {
    if (!isReceiptActive(r.status)) return
    const key = monthKey(r.issueDate)
    const cur = map.get(key) ?? { cobrado: 0, gastado: 0 }
    cur.cobrado += Number(r.amount || 0)
    map.set(key, cur)
  })

  payments.forEach((p) => {
    const key = monthKey(p.createdAt)
    const cur = map.get(key) ?? { cobrado: 0, gastado: 0 }
    cur.cobrado += Number(p.amount || 0)
    map.set(key, cur)
  })

  cobros.forEach((c) => {
    if (!c.paidAt) return
    const key = monthKey(c.paidAt)
    const cur = map.get(key) ?? { cobrado: 0, gastado: 0 }
    cur.cobrado += c.amount
    map.set(key, cur)
  })

  gastos.forEach((e) => {
    const key = monthKey(e.date)
    const cur = map.get(key) ?? { cobrado: 0, gastado: 0 }
    cur.gastado += e.amount
    map.set(key, cur)
  })

  return Array.from(map.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month))
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