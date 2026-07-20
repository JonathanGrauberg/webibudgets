// app\api\rendiciones\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

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

  // 3. Procesamos los presupuestos individuales calculando su costo real y ganancia neta
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

  // 4. 🌟 NUEVO: Recuperamos todas las distribuciones guardadas para esta rendición en la BD
  // Mapeando las relaciones dinámicamente a través de la tabla intermedia de RendicionSellerShare
  const sharesFromDb = await prisma.rendicionSellerShare.findMany({
    where: { rendicionId: id },
    include: { seller: { select: { userId: true, name: true, lastName: true } } }
  })

  // 5. 🌟 LÓGICA DEL PUNTO 3: Re-calcular el Panel Izquierdo basado puramente en lo Asignado/Distribuido
  // Armamos un diccionario indexado por User ID para consolidar el acumulado real exacto
  const acumuladoUsuarios: Record<string, { name: string; presupuestos: Set<string>; facturado: number; ganancia: number }> = {}

  // Inicializamos a todos los usuarios para que aparezcan listados con $0 si no tienen actividad
  tenantUsers.forEach(u => {
    acumuladoUsuarios[u.id] = { name: u.name, presupuestos: new Set(), facturado: 0, ganancia: 0 }
  })

  // Analizamos cada share guardado y le imputamos su porcentaje proporcional de la facturación y ganancia
  sharesFromDb.forEach(share => {
    const userId = share.seller.userId
    if (userId && acumuladoUsuarios[userId]) {
      acumuladoUsuarios[userId].ganancia += share.gananciaAPagar
      
      // Encontramos los presupuestos vinculados a este período para ponderar la facturación asignada
      budgetRows.forEach(b => {
        // Asignamos la proporción de facturación basada estrictamente en el porcentaje que cobró
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
  })).sort((a, b) => b.ganancia - a.ganancia) // Ordenados por mayor ganancia neta obtenida

  // 6. Mapeamos las asignaciones confirmadas estructuradas para el Frontend
  const asignacionesGuardadas = sharesFromDb.flatMap(share => {
    return budgetRows.map(b => ({
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
    presupuestosCompletados: rendicion.presupuestosCompletados,
    totalFacturado: rendicion.totalFacturado,
    totalCosto: rendicion.totalCosto,
    totalGanancia: rendicion.totalGanancia,
    margenPromedio: rendicion.margenPromedio,
    sellers: sellersRows, 
    budgets: budgetRows,
    tenantUsers, 
    asignacionesGuardadas, // 🌟 Pasado directamente al estado inicial de la vista
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