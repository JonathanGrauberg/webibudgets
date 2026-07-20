import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const rendicion = await prisma.rendicion.findFirst({
    where: { id, tenantId },
    include: {
      shares: { include: { seller: { select: { name: true, lastName: true } } } },
      budgets: {
        include: {
          budget: {
            include: {
              client: { select: { name: true, company: true } },
              seller: { select: { name: true, lastName: true } },
              items: { select: { quantity: true, cost: true, productService: { select: { cost: true } } } },
            },
          },
        },
      },
    },
  })

  if (!rendicion) {
    return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
  }

  const budgetRows = rendicion.budgets.map(({ budget: b }) => {
    let cost = 0
    for (const item of b.items) {
      const itemCost = item.cost ?? item.productService?.cost ?? 0
      cost += itemCost * item.quantity
    }
    const ganancia = b.total - cost
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
    }
  })

  return NextResponse.json({
    id: rendicion.id,
    periodStart: rendicion.periodStart.toISOString(),
    periodEnd: rendicion.periodEnd.toISOString(),
    status: rendicion.status,
    presupuestosCompletados: rendicion.presupuestosCompletados,
    totalFacturado: rendicion.totalFacturado,
    totalCosto: rendicion.totalCosto,
    totalGanancia: rendicion.totalGanancia,
    margenPromedio: rendicion.margenPromedio,
    sellers: rendicion.shares.map((s) => ({
      id: s.id,
      sellerId: s.sellerId,
      sellerName: `${s.seller.name} ${s.seller.lastName}`,
      presupuestosCompletados: s.presupuestosCompletados,
      totalFacturado: s.totalFacturado,
      ganancia: s.ganancia,
      margenPromedio: s.margenPromedio,
      percentage: s.percentage,
      gananciaAPagar: s.gananciaAPagar,
      isDefault: s.isDefault,
    })),
    budgets: budgetRows,
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