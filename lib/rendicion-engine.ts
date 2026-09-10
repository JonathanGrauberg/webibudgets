import { prisma } from '@/lib/prisma'
import type { BudgetStatus } from '@prisma/client' // 👈 nuevo — el enum real que genera Prisma

type BudgetForRendicion = {
  id: string
  budgetNumber: number | null
  status: string
  total: number
  createdAt: Date
  sellerId: string | null
  client: { name: string | null; company: string | null } | null
  seller: { name: string; lastName: string } | null
  items: {
    quantity: number
    cost: number | null
    productService: { cost: number | null } | null
  }[]
}

const NO_PAYMENT_STATUSES = new Set<BudgetStatus>(['draft', 'rejected', 'expired']) // 👈 antes: Set<string>
const INACTIVE_RECEIPT_STATUSES = new Set(['cancelled', 'anulado', 'voided', 'void', 'annulled'])

function isReceiptActive(status?: string | null) {
  if (!status) return true
  return !INACTIVE_RECEIPT_STATUSES.has(status)
}

function computeBudgetMetrics(budget: BudgetForRendicion) {
  let cost = 0
  let hasMissingCost = false

  for (const item of budget.items) {
    const itemCost = item.cost ?? item.productService?.cost ?? null
    if (itemCost != null) {
      cost += itemCost * item.quantity
    } else {
      hasMissingCost = true
    }
  }

  const ganancia = budget.total - cost
  const margen = budget.total > 0 ? (ganancia / budget.total) * 100 : 0

  return { cost, ganancia, margen, hasMissingCost }
}

export async function generateRendicionData(tenantId: string, periodStart: Date, periodEnd: Date) {
  // 🌟 "Saldado en el período" = el cobro que terminó de cubrir el total del
  // presupuesto ocurrió dentro de este rango. La plata puede haber entrado
  // por recibo manual (Receipt, efectivo/transferencia) o por el link de
  // cobro online (BudgetPayment, Mercado Pago) — ambas cuentan igual acá,
  // si no, un presupuesto pagado por MP nunca se marcaría como saldado.
  const [receiptsInPeriod, paymentsInPeriod] = await Promise.all([
    prisma.receipt.findMany({
      where: {
        budgetId: { not: null },
        createdAt: { gte: periodStart, lte: periodEnd },
        budget: { tenantId, status: { notIn: Array.from(NO_PAYMENT_STATUSES) } },
      },
      select: { budgetId: true, status: true },
    }),
    prisma.budgetPayment.findMany({
      where: {
        tenantId,
        status: 'approved',
        createdAt: { gte: periodStart, lte: periodEnd },
        budget: { status: { notIn: Array.from(NO_PAYMENT_STATUSES) } },
      },
      select: { budgetId: true },
    }),
  ])

  const candidateBudgetIds = Array.from(
    new Set([
      ...receiptsInPeriod.filter((r) => r.budgetId && isReceiptActive(r.status)).map((r) => r.budgetId as string),
      ...paymentsInPeriod.map((p) => p.budgetId),
    ])
  )

  if (candidateBudgetIds.length === 0) {
    return {
      presupuestosCompletados: 0,
      totalFacturado: 0,
      totalCosto: 0,
      totalGanancia: 0,
      totalGastosGenerales: 0, // 👈 nuevo
      margenPromedio: 0,
      anyMissingCost: false,
      sellerShares: [],
      budgetRows: [],
    }
  }

  const candidateBudgets = await prisma.budget.findMany({
    where: { id: { in: candidateBudgetIds }, tenantId },
    include: {
      client: { select: { name: true, company: true } },
      seller: { select: { name: true, lastName: true } },
      items: { select: { quantity: true, cost: true, productService: { select: { cost: true } } } },
      receipts: { select: { amount: true, status: true, sourceBudgetPaymentId: true } },
      payments: { select: { amount: true, status: true } },
    },
  }) as unknown as (BudgetForRendicion & {
    receipts: { amount: number; status: string | null; sourceBudgetPaymentId: string | null }[]
    payments: { amount: number; status: string }[]
  })[]

  const budgets = candidateBudgets.filter((b) => {
    // 👇 sourceBudgetPaymentId: un recibo "espejo" de un BudgetPayment ya
    // sumado más abajo — contarlo acá también duplicaría la plata.
    const collectedReceipts = b.receipts
      .filter((r) => isReceiptActive(r.status) && !r.sourceBudgetPaymentId)
      .reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const collectedPayments = b.payments
      .filter((p) => p.status === 'approved')
      .reduce((acc, p) => acc + Number(p.amount || 0), 0)
    const collected = collectedReceipts + collectedPayments
    return collected >= b.total && b.total > 0
  })

  // 🌟 nuevo — Gastos del período. Separamos los asociados a un trabajo puntual
  // (restan de LA GANANCIA DE ESE TRABAJO, no de otro) de los generales del negocio
  // (restan del total del período — nadie puede "adjudicarle" el alquiler a un
  // presupuesto específico, así que no tocan la ganancia de ninguna fila individual).
  const budgetIds = budgets.map((b) => b.id)
  const [budgetExpenses, generalExpenses] = await Promise.all([
    budgetIds.length > 0
      ? prisma.expense.findMany({
          where: { tenantId, budgetId: { in: budgetIds } },
          select: { budgetId: true, amount: true },
        })
      : Promise.resolve([]),
    prisma.expense.findMany({
      where: { tenantId, budgetId: null, date: { gte: periodStart, lte: periodEnd } },
      select: { amount: true },
    }),
  ])

  const expensesByBudget = new Map<string, number>()
  for (const e of budgetExpenses) {
    if (!e.budgetId) continue
    expensesByBudget.set(e.budgetId, (expensesByBudget.get(e.budgetId) ?? 0) + e.amount)
  }
  const totalGastosGenerales = generalExpenses.reduce((acc, e) => acc + e.amount, 0)

  const activeSellers = await prisma.seller.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, lastName: true },
  })

  let totalFacturado = 0
  let totalCosto = 0
  let totalGanancia = 0
  let anyMissingCost = false

  const budgetRows = budgets.map((b) => {
    const { cost, ganancia: gananciaBruta, margen: margenBruto, hasMissingCost } = computeBudgetMetrics(b)
    const gastosAsociados = expensesByBudget.get(b.id) ?? 0 // 👈 nuevo
    const ganancia = gananciaBruta - gastosAsociados // 👈 nuevo — la ganancia real de ESTE trabajo, ya con sus gastos puntuales descontados
    const margen = b.total > 0 ? (ganancia / b.total) * 100 : margenBruto

    totalFacturado += b.total
    totalCosto += cost
    totalGanancia += ganancia
    if (hasMissingCost) anyMissingCost = true

    return {
      budgetId: b.id,
      clienteName: b.client?.company || b.client?.name || '—',
      vendedorName: b.seller ? `${b.seller.name} ${b.seller.lastName}` : 'Sin asignar',
      budgetNumber: b.budgetNumber ?? 0,
      fecha: b.createdAt,
      estado: b.status,
      total: b.total,
      costo: cost,
      ganancia,
      margen,
      gastosAsociados, // 👈 nuevo
      sellerId: b.sellerId,
    }
  })

  totalGanancia -= totalGastosGenerales // 👈 nuevo — los gastos generales bajan el total del período, no ninguna fila puntual

  const margenPromedio = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0

  const perfBySeller = new Map<string, { count: number; facturado: number; ganancia: number }>()
  for (const row of budgetRows) {
    if (!row.sellerId) continue
    const acc = perfBySeller.get(row.sellerId) ?? { count: 0, facturado: 0, ganancia: 0 }
    acc.count += 1
    acc.facturado += row.total
    acc.ganancia += row.ganancia
    perfBySeller.set(row.sellerId, acc)
  }

  const equalShare = activeSellers.length > 0 ? 100 / activeSellers.length : 0

  const sellerShares = activeSellers.map((s) => {
    const perf = perfBySeller.get(s.id) ?? { count: 0, facturado: 0, ganancia: 0 }
    return {
      sellerId: s.id,
      sellerName: `${s.name} ${s.lastName}`,
      presupuestosCompletados: perf.count,
      totalFacturado: perf.facturado,
      ganancia: perf.ganancia,
      margenPromedio: perf.facturado > 0 ? (perf.ganancia / perf.facturado) * 100 : 0,
      percentage: equalShare,
      gananciaAPagar: totalGanancia * (equalShare / 100),
      isDefault: true,
    }
  })

  return {
    presupuestosCompletados: budgetRows.length,
    totalFacturado,
    totalCosto,
    totalGanancia,
    totalGastosGenerales, // 👈 nuevo
    margenPromedio,
    anyMissingCost,
    sellerShares,
    budgetRows,
  }
}