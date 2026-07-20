//app\api\rendiciones\[id]\shares\[shareId]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id, shareId } = await params
    const data = await request.json()

    const rendicion = await prisma.rendicion.findFirst({ where: { id, tenantId } })
    if (!rendicion) {
      return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
    }
    if (rendicion.status === 'closed') {
      return NextResponse.json({ error: 'No se puede editar una rendición cerrada' }, { status: 400 })
    }

    let percentage: number
    let isDefault: boolean

    if (data.reset === true) {
      const shareCount = await prisma.rendicionSellerShare.count({ where: { rendicionId: id } })
      percentage = shareCount > 0 ? 100 / shareCount : 0
      isDefault = true
    } else {
      percentage = Number(data.percentage)
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        return NextResponse.json({ error: 'Porcentaje inválido' }, { status: 400 })
      }
      isDefault = false
    }

    const gananciaAPagar = rendicion.totalGanancia * (percentage / 100)

    const result = await prisma.rendicionSellerShare.updateMany({
      where: { id: shareId, rendicionId: id },
      data: { percentage, gananciaAPagar, isDefault },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Reparto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, percentage, gananciaAPagar })
  } catch (error) {
    console.error('Error updating share:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}