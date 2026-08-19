// app\api\rendiciones\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

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
              receipts: { select: { amount: true, status: true } },
              expenses: { select: { amount: true } },
            },
          },
        },
      },
    },
  })

  if (!rendicion) {
    return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
  }

  const users = await prisma.user.findMany({
    where: { tenantId, active: true },
    select: { id: true, name: true, role: true, seller: { select: { id: true } } },
  })

  const tenantUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    role: (u.role === 'admin' || u.role === 'owner') ? 'admin' : 'seller'
  }))

  const userBySellerId = new Map<string, { id: string; name: string; role: 'admin' | 'seller' }>()
  users.forEach(u => {
    if (u.seller?.id) {
      userBySellerId.set(u.seller.id, {
        id: u.id,
        name: u.name,
        role: (u.role === 'admin' || u.role === 'owner') ? 'admin' : 'seller',
      })
    }
  })

  const budgetRowsAll = rendicion.budgets.map(({ budget: b }) => {
    let cost = 0
    for (const item of b.items) {
      const itemCost = item.cost ?? item.productService?.cost ?? 0
      cost += itemCost * item.quantity
    }
    const gananciaBruta = b.total - cost

    const collected = b.receipts
      .filter((r) => isReceiptActive(r.status))
      .reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const saldado = collected >= b.total && b.total > 0

    const gastosAsociados = b.expenses.reduce((acc, e) => acc + e.amount, 0)
    const ganancia = gananciaBruta - gastosAsociados
    const margen = b.total > 0 ? (ganancia / b.total) * 100 : 0

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
      saldado,
      gastosAsociados,
    }
  })

  const budgetRows = budgetRowsAll.filter((b) => b.saldado)
  const budgetRowsNoLongerCompleted = budgetRowsAll.filter((b) => !b.saldado)

  const generalExpenses = await prisma.expense.findMany({
    where: {
      tenantId,
      budgetId: null,
      date: { gte: rendicion.periodStart, lte: rendicion.periodEnd },
    },
    select: { amount: true },
  })
  const totalGastosGenerales = generalExpenses.reduce((acc, e) => acc + e.amount, 0)

  const totalFacturado = budgetRows.reduce((acc, b) => acc + b.total, 0)
  const totalCosto = budgetRows.reduce((acc, b) => acc + b.costo, 0)
  const totalGanancia = budgetRows.reduce((acc, b) => acc + b.ganancia, 0) - totalGastosGenerales
  const margenPromedio = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0

  // 👇 RESTAURADO — el reparto real, guardado por presupuesto puntual en RendicionAsignacion.
  // Esto es lo que se había perdido en la versión anterior (leía de la tabla vieja RendicionSellerShare).
  const asignacionesDb = await prisma.rendicionAsignacion.findMany({
    where: { rendicionId: id },
  })

  const budgetById = new Map(budgetRowsAll.map((b) => [b.id, b]))

  const asignacionesGuardadas = asignacionesDb
    .map((a) => {
      const u = userBySellerId.get(a.sellerId)
      const b = budgetById.get(a.budgetId)
      if (!u || !b) return null
      return {
        budgetId: a.budgetId,
        budgetNumber: String(b.budgetNumber).padStart(6, '0'),
        vendedorId: u.id,
        vendedorName: u.name,
        role: u.role,
        porcentaje: a.percentage,
        gananciaAsignada: a.monto,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const acumuladoUsuarios: Record<string, { name: string; presupuestos: Set<string>; facturado: number; ganancia: number }> = {}

  tenantUsers.forEach(u => {
    acumuladoUsuarios[u.id] = { name: u.name, presupuestos: new Set(), facturado: 0, ganancia: 0 }
  })

  asignacionesGuardadas.forEach((a) => {
    const acc = acumuladoUsuarios[a.vendedorId]
    const b = budgetById.get(a.budgetId)
    if (!acc || !b) return
    acc.ganancia += a.gananciaAsignada
    acc.facturado += b.total * (a.porcentaje / 100)
    acc.presupuestos.add(a.budgetId)
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

  return NextResponse.json({
    id: rendicion.id,
    periodStart: rendicion.periodStart.toISOString(),
    periodEnd: rendicion.periodEnd.toISOString(),
    status: rendicion.status,
    presupuestosCompletados: budgetRows.length,
    totalFacturado,
    totalCosto,
    totalGanancia,
    totalGastosGenerales,
    margenPromedio,
    sellers: canSeeDistribution ? sellersRows : [],
    budgets: budgetRows,
    budgetsNoLongerCompleted: budgetRowsNoLongerCompleted,
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