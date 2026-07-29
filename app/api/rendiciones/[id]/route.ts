// app\api\rendiciones\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, features: true },
  })
  const canSeeDistribution = !!tenant && hasFeature(tenant, 'commissions') // 👈 nuevo

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
  // costo real y ganancia neta. `estado` acá es el estado ACTUAL y en vivo del
  // presupuesto (viene de la relación `budget`, no de un valor guardado en el momento
  // de generar la rendición).
  const budgetRowsAll = rendicion.budgets.map(({ budget: b }) => {
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

  // 🌟 Un presupuesto pudo haber estado "Completado" cuando se generó la rendición y
  // luego volver a un estado anterior (ej: faltó terminar algo, no se cobró todavía).
  // Separamos ambos casos: solo los que siguen "completed" HOY entran en la tabla
  // principal y en los totales de la rendición; el resto se expone aparte, sin afectar
  // lo ya calculado o repartido.
  const budgetRows = budgetRowsAll.filter((b) => b.estado === 'completed')
  const budgetRowsNoLongerCompleted = budgetRowsAll.filter((b) => b.estado !== 'completed')

  const totalFacturado = budgetRows.reduce((acc, b) => acc + b.total, 0)
  const totalCosto = budgetRows.reduce((acc, b) => acc + b.costo, 0)
  const totalGanancia = budgetRows.reduce((acc, b) => acc + b.ganancia, 0)
  const margenPromedio = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0

  // 4. 🌟 Recuperamos todas las distribuciones guardadas para esta rendición en la BD.
  // Nota: para el panel de distribución y el historial de ganancias ya repartidas
  // usamos `budgetRowsAll` (todos los presupuestos de la rendición), no solo los que
  // siguen completados hoy — si ya se repartió y/o pagó esa plata, no debe
  // desaparecer solo porque el estado del presupuesto cambió después.
  const sharesFromDb = await prisma.rendicionSellerShare.findMany({
    where: { rendicionId: id },
    include: { seller: { select: { userId: true, name: true, lastName: true } } }
  })

  // 5. 🌟 Re-calcular el Panel Izquierdo basado puramente en lo Asignado/Distribuido
  const acumuladoUsuarios: Record<string, { name: string; presupuestos: Set<string>; facturado: number; ganancia: number }> = {}

  tenantUsers.forEach(u => {
    acumuladoUsuarios[u.id] = { name: u.name, presupuestos: new Set(), facturado: 0, ganancia: 0 }
  })

  sharesFromDb.forEach(share => {
    const userId = share.seller.userId
    if (userId && acumuladoUsuarios[userId]) {
      acumuladoUsuarios[userId].ganancia += share.gananciaAPagar

      budgetRowsAll.forEach(b => {
        const recordProporcional = (b.total * (share.percentage / 100))
        acumuladoUsuarios[userId].facturado += recordProporcional
        acumuladoUsuarios[userId].presupuestos.add(b.id)
      })
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

  // 6. Mapeamos las asignaciones confirmadas estructuradas para el Frontend
  const asignacionesGuardadas = sharesFromDb.flatMap(share => {
    return budgetRowsAll.map(b => ({
      budgetId: b.id,
      budgetNumber: String(b.budgetNumber).padStart(6, "0"),
      vendedorId: share.seller.userId || '',
      vendedorName: `${share.seller.name} ${share.seller.lastName}`,
      role: tenantUsers.find(u => u.id === share.seller.userId)?.role || 'seller',
      porcentaje: share.percentage,
      gananciaAsignada: b.ganancia * (share.percentage / 100)
    }))
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
    budgets: budgetRows,                                              // 👈 solo los que siguen "completed" hoy
    budgetsNoLongerCompleted: budgetRowsNoLongerCompleted,             // 👈 nuevo — los que se cayeron de "completado"
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