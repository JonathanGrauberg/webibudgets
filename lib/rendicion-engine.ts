import { prisma } from '@/lib/prisma'

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
  // 🌟 "Completado en el período" = pasó a estado 'completed' dentro del rango,
  // no simplemente updatedAt — evita falsos positivos por ediciones posteriores.
  const completions = await prisma.budgetStatusHistory.findMany({
    where: {
      to: 'completed',
      changedAt: { gte: periodStart, lte: periodEnd },
      budget: { tenantId },
    },
    select: { budgetId: true },
    distinct: ['budgetId'],
  })

  const budgetIds = completions.map((c) => c.budgetId)

  const budgets = await prisma.budget.findMany({
    where: { id: { in: budgetIds }, tenantId },
    include: {
      client: { select: { name: true, company: true } },
      seller: { select: { name: true, lastName: true } },
      items: { select: { quantity: true, cost: true, productService: { select: { cost: true } } } },
    },
  }) as unknown as BudgetForRendicion[]

  const activeSellers = await prisma.seller.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, lastName: true },
  })

  // Totales generales
  let totalFacturado = 0
  let totalCosto = 0
  let totalGanancia = 0
  let anyMissingCost = false

  const budgetRows = budgets.map((b) => {
    const { cost, ganancia, margen, hasMissingCost } = computeBudgetMetrics(b)
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
      sellerId: b.sellerId,
    }
  })

  const margenPromedio = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0

  // Performance por vendedor (solo informativo — quién generó qué)
  const perfBySeller = new Map<string, { count: number; facturado: number; ganancia: number }>()
  for (const row of budgetRows) {
    if (!row.sellerId) continue
    const acc = perfBySeller.get(row.sellerId) ?? { count: 0, facturado: 0, ganancia: 0 }
    acc.count += 1
    acc.facturado += row.total
    acc.ganancia += row.ganancia
    perfBySeller.set(row.sellerId, acc)
  }

  // Reparto por defecto: partes iguales entre vendedores activos
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
    margenPromedio,
    anyMissingCost,
    sellerShares,
    budgetRows,
  }
}