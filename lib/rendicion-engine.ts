import { prisma } from '@/lib/prisma'
import type { BudgetStatus } from '@prisma/client'

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

// 🌟 Mismos criterios que ya usa app/(dashboard)/documents/page.tsx
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
  // 🌟 "Saldado en el período" = el recibo que terminó de cubrir el total
  // del presupuesto se emitió dentro de este rango. Un mismo trabajo nunca
  // debería aparecer en dos rendiciones distintas — solo en la del período
  // donde efectivamente se completó el cobro (aunque haya tenido pagos
  // parciales anteriores en otros períodos).
  //
  // ⚠️ Usa `createdAt` del recibo como fecha de emisión — si tu sistema
  // maneja fechas de emisión distintas (recibos con fecha retroactiva vía
  // un campo `issueDate`), avisame y cambiamos el filtro para usar ese
  // campo en su lugar.
  const receiptsInPeriod = await prisma.receipt.findMany({
    where: {
      budgetId: { not: null },
      createdAt: { gte: periodStart, lte: periodEnd },
      budget: { tenantId, status: { notIn: Array.from(NO_PAYMENT_STATUSES) } },
    },
    select: { budgetId: true, status: true },
  })

  const candidateBudgetIds = Array.from(
    new Set(
      receiptsInPeriod
        .filter((r) => r.budgetId && isReceiptActive(r.status))
        .map((r) => r.budgetId as string)
    )
  )

  if (candidateBudgetIds.length === 0) {
    return {
      presupuestosCompletados: 0,
      totalFacturado: 0,
      totalCosto: 0,
      totalGanancia: 0,
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
      receipts: { select: { amount: true, status: true } }, // 👈 nuevo — TODOS los recibos del presupuesto, no solo los del período, para calcular el cobrado real
    },
  }) as unknown as (BudgetForRendicion & { receipts: { amount: number; status: string | null }[] })[]

  // 🌟 De los candidatos (tuvieron un recibo activo en este período), nos
  // quedamos solo con los que HOY están efectivamente saldados de punta a
  // punta — mismo cálculo exacto que PaymentStatusBadge en documents/page.tsx
  const budgets = candidateBudgets.filter((b) => {
    const collected = b.receipts
      .filter((r) => isReceiptActive(r.status))
      .reduce((acc, r) => acc + Number(r.amount || 0), 0)
    return collected >= b.total && b.total > 0
  })

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
      estado: b.status, // 👈 sigue viajando — ahora es solo informativo ("Estado del trabajo" en la UI), no el criterio de selección
      total: b.total,
      costo: cost,
      ganancia,
      margen,
      saldado: true, // 👈 nuevo — siempre true acá, porque ya filtramos arriba. Se guarda igual para que el tipo compartido con el frontend sea consistente.
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