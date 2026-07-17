import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id, itemId } = await params
    const data = await request.json()

    // Verificamos tenencia a través de la OT (evita que alguien tilde ítems de otro tenant)
    const workOrder = await prisma.workOrder.findFirst({ where: { id, tenantId }, select: { id: true } })
    if (!workOrder) return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })

    const item = await prisma.workOrderChecklistItem.update({
      where: { id: itemId },
      data: {
        completed: !!data.completed,
        completedAt: data.completed ? new Date() : null,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}