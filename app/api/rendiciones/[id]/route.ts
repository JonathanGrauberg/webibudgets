// app\api\rendiciones\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

// 🌟 Mismo criterio que documents/page.tsx y lib/rendicion-engine.ts —
// importante que los tres coincidan siempre en qué es "saldado".
const INACTIVE_RECEIPT_STATUSES = new Set(['cancelled', 'anulado', 'voided', 'void', 'annulled'])

function isReceiptActive(status?: string | null) {
  if (!status) return true
  return !INACTIVE_RECEIPT_STATUSES.has(status)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, features: true },
  })
  const canSeeDistribution = !!tenant && hasFeature(tenant, 'commissions')

  // 1. Buscamos la rendición con sus relaciones esenciales
  const rendicion = await prisma.rendicion.findFirst({
    where: { id, tenantId },
    include: {
      budgets: {
        include: {
          budget: {
            include: {
              client: { select: { name: true, company: true } },
              seller: { select: { name: true, lastName: true, userId: true } },
              items: { select: { quantity: true, cost: true, productService: { select: { cost: true } } } },
              receipts: { select: { amount: true, status: true } }, // 👈 nuevo — para recalcular "saldado" en vivo
            },
          },
        },
      },
    },
  })

  if (!rendicion) {
    return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
  }

  // 2. Traemos dinámicamente los usuarios de este Tenant
  const users = await prisma.user.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, role: true, seller: { select: { id: true } } },
  })

  const tenantUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    role: (u.role === 'admin' || u.role === 'owner') ? 'admin' : 'seller'
  }))

  // 3. Procesamos TODOS los presupuestos vinculados a la rendición, calculando su
  // costo real, ganancia neta, y si HOY siguen saldados (recalculado en vivo a
  // partir de sus recibos activos — no de un valor guardado en el momento de
  // generar la rendición). `estado` acá sigue siendo el estado del TRABAJO
  // (draft/sent/approved/completed), ahora puramente informativo.
  const budgetRowsAll = rendicion.budgets.map(({ budget: b }) => {
    let cost = 0
    for (const item of b.items) {
      const itemCost = item.cost ?? item.productService?.cost ?? 0
      cost += itemCost * item.quantity
    }
    const ganancia = b.total - cost
    const margen = b.total > 0 ? (ganancia / b.total) * 100 : 0

    const collected = b.receipts
      .filter((r) => isReceiptActive(r.status))
      .reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const saldado = collected >= b.total && b.total > 0

    return {
      id: b.id,
      clienteName: b.client?.company || b.client?.name || '—',
      vendedorName: b.seller ? `${b.seller.name} ${b.seller.lastName}` : 'Sin asignar',
      budgetNumber: b.budgetNumber ?? 0,
      fecha: b.createdAt.toISOString(),
      estado: b.status,
      total: b.total,
      costo: cost,
      ganancia,
      margen,
      saldado, // 👈 nuevo
    }
  })

  // 🌟 Un presupuesto pudo haber estado "Saldado" cuando se generó la rendición y
  // luego dejar de estarlo (ej: se anuló un recibo). Separamos ambos casos: solo
  // los que siguen saldados HOY entran en la tabla principal y en los totales de
  // la rendición; el resto se expone aparte, sin afectar lo ya calculado o repartido.
  const budgetRows = budgetRowsAll.filter((b) => b.saldado) // 👈 antes: b.estado === 'completed'
  const budgetRowsNoLongerCompleted = budgetRowsAll.filter((b) => !b.saldado) // 👈 antes: b.estado !== 'completed'

  const totalFacturado = budgetRows.reduce((acc, b) => acc + b.total, 0)
  const totalCosto = budgetRows.reduce((acc, b) => acc + b.costo, 0)
  const totalGanancia = budgetRows.reduce((acc, b) => acc + b.ganancia, 0)
  const margenPromedio = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0

  // 4. 🌟 Traemos las asignaciones REALES guardadas, una fila por presupuesto +
  // vendedor (ya no un solo % por vendedor aplicado a toda la rendición). Esta es
  // ahora la única fuente de verdad para "quién se lleva qué, de qué trabajo".
  // Usamos `budgetRowsAll` (todos los presupuestos de la rendición) para no perder
  // reparto ya guardado si un presupuesto dejó de estar saldado después.
  const asignacionesFromDb = await prisma.rendicionAsignacion.findMany({
    where: { rendicionId: id },
  })

  const sellerIds = Array.from(new Set(asignacionesFromDb.map((a) => a.sellerId)))
  const sellersInfo = sellerIds.length > 0
    ? await prisma.seller.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, name: true, lastName: true, userId: true },
      })
    : []
  const sellersById = new Map(sellersInfo.map((s) => [s.id, s]))
  const budgetsById = new Map(budgetRowsAll.map((b) => [b.id, b]))

  // 5. 🌟 Re-calcular el Panel Izquierdo sumando directamente cada asignación real
  // (cada una ya trae su propio % y monto para ESE presupuesto puntual).
  const acumuladoUsuarios: Record<string, { name: string; presupuestos: Set<string>; facturado: number; ganancia: number }> = {}

  tenantUsers.forEach(u => {
    acumuladoUsuarios[u.id] = { name: u.name, presupuestos: new Set(), facturado: 0, ganancia: 0 }
  })

  asignacionesFromDb.forEach((a) => {
    const seller = sellersById.get(a.sellerId)
    const userId = seller?.userId
    if (!userId || !acumuladoUsuarios[userId]) return

    acumuladoUsuarios[userId].ganancia += a.monto
    acumuladoUsuarios[userId].presupuestos.add(a.budgetId)

    const budget = budgetsById.get(a.budgetId)
    if (budget) {
      acumuladoUsuarios[userId].facturado += budget.total * (a.percentage / 100)
    }
  })

  const sellersRows = Object.entries(acumuladoUsuarios).map(([userId, data]) => ({
    id: userId,
    sellerId: users.find(u => u.id === userId)?.seller?.id || '',
    sellerName: data.name,
    presupuestosCompletados: data.presupuestos.size,
    totalFacturado: data.facturado,
    ganancia: data.ganancia,
    margenPromedio: data.facturado > 0 ? (data.ganancia / data.facturado) * 100 : 0
  })).sort((a, b) => b.ganancia - a.ganancia)

  // 6. Mapeamos las asignaciones confirmadas para el Frontend — ahora una fila
  // real por presupuesto + vendedor, tal cual quedó guardado.
  const asignacionesGuardadas = asignacionesFromDb.map((a) => {
    const seller = sellersById.get(a.sellerId)
    const budget = budgetsById.get(a.budgetId)

    return {
      budgetId: a.budgetId,
      budgetNumber: budget ? String(budget.budgetNumber).padStart(6, "0") : '',
      vendedorId: seller?.userId || '',
      vendedorName: seller ? `${seller.name} ${seller.lastName}` : 'Desconocido',
      role: tenantUsers.find(u => u.id === seller?.userId)?.role || 'seller',
      porcentaje: a.percentage,
      gananciaAsignada: a.monto,
    }
  })

  return NextResponse.json({
    id: rendicion.id,
    periodStart: rendicion.periodStart.toISOString(),
    periodEnd: rendicion.periodEnd.toISOString(),
    status: rendicion.status,
    presupuestosCompletados: budgetRows.length,
    totalFacturado,
    totalCosto,
    totalGanancia,
    margenPromedio,
    sellers: canSeeDistribution ? sellersRows : [],
    budgets: budgetRows,                                              // 👈 solo los que siguen saldados hoy
    budgetsNoLongerCompleted: budgetRowsNoLongerCompleted,             // 👈 los que se cayeron de "saldado"
    tenantUsers: canSeeDistribution ? tenantUsers : [],
    asignacionesGuardadas: canSeeDistribution ? asignacionesGuardadas : [],
    currency: 'ARS',
  })

}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    if (data.status !== 'closed') {
      return NextResponse.json({ error: 'Solo se admite cerrar una rendición' }, { status: 400 })
    }

    const result = await prisma.rendicion.updateMany({
      where: { id, tenantId, status: 'draft' },
      data: { status: 'closed', closedAt: new Date() },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Rendición no encontrada o ya estaba cerrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error closing rendicion:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}