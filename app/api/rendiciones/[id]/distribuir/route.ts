// app\api\rendiciones\[id]\distribuir\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id: rendicionId } = await params
    const { budgetId, distribuciones } = await request.json() 

    const rendicion = await prisma.rendicion.findFirst({
      where: { id: rendicionId, tenantId }
    })
    if (!rendicion) {
      return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
    }
    if (rendicion.status === 'closed') {
      return NextResponse.json({ error: 'La rendición ya se encuentra cerrada' }, { status: 400 })
    }

    // Ejecutamos todo en una transacción segura
    await prisma.$transaction(async (tx) => {
      
      for (const dist of distribuciones) {
        // 1. 🌟 CLAVE: Buscamos si el User tiene un Seller ID vinculado en la base de datos
        const userWithSeller = await tx.user.findUnique({
          where: { id: dist.userId },
          include: { seller: true }
        })

        if (!userWithSeller) continue;

        let targetSellerId: string;

        if (userWithSeller.seller) {
          // Si ya tiene un perfil de vendedor (ej. Felipe), usamos ese ID
          targetSellerId = userWithSeller.seller.id;
        } else {
          // Si es un Admin/Owner (ej. Jonathan o Eliana) que no tiene perfil de vendedor, 
          // se lo creamos automáticamente al vuelo para cumplir con la Foreign Key
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

        // 2. Ahora sí buscamos o creamos el Share usando el `targetSellerId` real de la tabla Seller
        const existeShare = await tx.rendicionSellerShare.findFirst({
          where: { rendicionId, sellerId: targetSellerId }
        })

        if (existeShare) {
          await tx.rendicionSellerShare.update({
            where: { id: existeShare.id },
            data: {
              gananciaAPagar: { increment: dist.monto },
              isDefault: false
            }
          })
        } else {
          await tx.rendicionSellerShare.create({
            data: {
              rendicionId,
              sellerId: targetSellerId, // 🌟 ID correcto y validado
              presupuestosCompletados: 1,
              totalFacturado: 0,
              ganancia: dist.monto,
              margenPromedio: 100,
              percentage: dist.porcentaje,
              gananciaAPagar: dist.monto,
              isDefault: false
            }
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error guardando distribucion:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}