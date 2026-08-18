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

    if (!budgetId || !Array.isArray(distribuciones)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
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

    // 3. Guardamos el reparto de ESTE presupuesto puntual — reemplaza, no acumula
    await prisma.$transaction(async (tx) => {

      // 🌟 Borramos cualquier reparto previo de este presupuesto en esta rendición.
      // Así, si volvés a guardar (ej: cambiaste de 50/50 a 100/0), la fila vieja
      // desaparece en vez de quedar sumada a la nueva.
      await tx.rendicionAsignacion.deleteMany({
        where: { rendicionId, budgetId },
      })

      for (const dist of distribuciones) {
        if (!dist.porcentaje || dist.porcentaje <= 0) continue // 👈 0% no se guarda, no aporta nada

        // 🌟 Buscamos si el User tiene un Seller ID vinculado en la base de datos
        const userWithSeller = await tx.user.findUnique({
          where: { id: dist.userId },
          include: { seller: true }
        })

        if (!userWithSeller) continue;

        let targetSellerId: string;

        if (userWithSeller.seller) {
          targetSellerId = userWithSeller.seller.id;
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
          targetSellerId = newSeller.id;
        }

        // 🌟 Ahora sí: una fila por (rendición, presupuesto, vendedor) — nunca se
        // acumula con otro presupuesto, cada uno vive en su propia fila.
        await tx.rendicionAsignacion.create({
          data: {
            rendicionId,
            budgetId,
            sellerId: targetSellerId,
            percentage: dist.porcentaje,
            monto: dist.monto,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error guardando distribucion:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}