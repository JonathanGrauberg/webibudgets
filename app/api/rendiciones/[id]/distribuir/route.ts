// app\api\rendiciones\[id]\distribuir\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id: rendicionId } = await params
    const { budgetId, distribuciones } = await request.json()

    if (!budgetId) {
      return NextResponse.json({ error: 'Falta el ID del presupuesto' }, { status: 400 })
    }

    // 🔒 1. Verificación de Plan PRO en servidor
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, features: true },
    })

    if (!tenant || !hasFeature(tenant, 'commissions')) {
      return NextResponse.json(
        { error: 'La distribución de ganancias requiere el plan PRO.' },
        { status: 403 }
      )
    }

    // 2. Validaciones existentes de la rendición
    const rendicion = await prisma.rendicion.findFirst({
      where: { id: rendicionId, tenantId }
    })
    if (!rendicion) {
      return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
    }
    if (rendicion.status === 'closed') {
      return NextResponse.json({ error: 'La rendición ya se encuentra cerrada' }, { status: 400 })
    }

    // 3. Ejecutamos todo en una transacción segura
    await prisma.$transaction(async (tx) => {

      // 3a. Resolvemos el Seller.id de cada usuario del payload (igual que antes:
      // si un Admin/Owner todavía no tiene perfil de vendedor, se crea al vuelo)
      const resueltos: { sellerId: string; porcentaje: number; monto: number }[] = []

      for (const dist of distribuciones) {
        const userWithSeller = await tx.user.findUnique({
          where: { id: dist.userId },
          include: { seller: true }
        })

        if (!userWithSeller) continue

        let targetSellerId: string

        if (userWithSeller.seller) {
          targetSellerId = userWithSeller.seller.id
        } else {
          const newSeller = await tx.seller.create({
            data: {
              tenantId,
              userId: userWithSeller.id,
              name: userWithSeller.name.split(' ')[0] || 'Admin',
              lastName: userWithSeller.name.split(' ').slice(1).join(' ') || 'Sistema',
              active: true
            }
          })
          targetSellerId = newSeller.id
        }

        resueltos.push({
          sellerId: targetSellerId,
          porcentaje: dist.porcentaje,
          monto: dist.monto
        })
      }

      // 3b. 👈 EL FIX: reemplazamos por completo el reparto de ESTE presupuesto
      // puntual — borramos lo viejo y creamos lo nuevo, en vez de sumar encima.
      await tx.rendicionAsignacion.deleteMany({
        where: { rendicionId, budgetId }
      })

      if (resueltos.length > 0) {
        await tx.rendicionAsignacion.createMany({
          data: resueltos.map((r) => ({
            rendicionId,
            budgetId,
            sellerId: r.sellerId,
            percentage: r.porcentaje,
            monto: r.monto,
          }))
        })
      }

      // 3c. Recalculamos el acumulado por vendedor (RendicionSellerShare) desde
      // cero, sumando TODAS sus asignaciones reales en esta rendición — nunca
      // incrementando sobre un valor guardado previamente.
      const sellerIdsAfectados = new Set(resueltos.map((r) => r.sellerId))

      // Incluimos también a quienes tenían reparto en este presupuesto y quedaron
      // afuera del nuevo payload (pasaron a 0% y el frontend no los manda).
      const asignacionesVigentes = await tx.rendicionAsignacion.findMany({
        where: { rendicionId }
      })
      asignacionesVigentes.forEach((a) => sellerIdsAfectados.add(a.sellerId))

      const rendicionActual = await tx.rendicion.findUnique({
        where: { id: rendicionId },
        select: { totalGanancia: true }
      })

      for (const sellerId of sellerIdsAfectados) {
        const asignacionesDelVendedor = asignacionesVigentes.filter(
          (a) => a.sellerId === sellerId
        )

        const gananciaTotal = asignacionesDelVendedor.reduce((acc, a) => acc + a.monto, 0)
        const presupuestosDistintos = new Set(
          asignacionesDelVendedor.map((a) => a.budgetId)
        ).size

        const budgetsDelVendedor = await tx.budget.findMany({
          where: { id: { in: asignacionesDelVendedor.map((a) => a.budgetId) } },
          select: { id: true, total: true }
        })
        const totalPorBudget = new Map(budgetsDelVendedor.map((b) => [b.id, b.total]))
        const totalFacturado = asignacionesDelVendedor.reduce((acc, a) => {
          const total = totalPorBudget.get(a.budgetId) ?? 0
          return acc + total * (a.percentage / 100)
        }, 0)

        const porcentajeSobreRendicion =
          rendicionActual && rendicionActual.totalGanancia > 0
            ? (gananciaTotal / rendicionActual.totalGanancia) * 100
            : 0

        await tx.rendicionSellerShare.upsert({
          where: { rendicionId_sellerId: { rendicionId, sellerId } },
          update: {
            gananciaAPagar: gananciaTotal,
            ganancia: gananciaTotal,
            percentage: porcentajeSobreRendicion,
            presupuestosCompletados: presupuestosDistintos,
            totalFacturado,
            margenPromedio: totalFacturado > 0 ? (gananciaTotal / totalFacturado) * 100 : 100,
            isDefault: false,
          },
          create: {
            rendicionId,
            sellerId,
            presupuestosCompletados: presupuestosDistintos,
            totalFacturado,
            ganancia: gananciaTotal,
            margenPromedio: totalFacturado > 0 ? (gananciaTotal / totalFacturado) * 100 : 100,
            percentage: porcentajeSobreRendicion,
            gananciaAPagar: gananciaTotal,
            isDefault: false,
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error guardando distribucion:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}