import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; toolId: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id, toolId } = await params
    const data = await request.json()

    const workOrder = await prisma.workOrder.findFirst({ where: { id, tenantId }, select: { id: true } })
    if (!workOrder) return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })

    const tool = await prisma.workOrderTool.update({
      where: { id: toolId },
      data: { checked: !!data.checked },
    })

    return NextResponse.json(tool)
  } catch (error) {
    console.error('Error updating tool:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}