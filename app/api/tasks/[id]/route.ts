//app\api\tasks\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const updateData: Record<string, unknown> = {}
    if (typeof data.title === 'string') updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.column !== undefined) updateData.column = data.column
    if (data.order !== undefined) updateData.order = Number(data.order)
    if (data.linkType !== undefined) updateData.linkType = data.linkType || null
    if (data.linkId !== undefined) updateData.linkId = data.linkId || null

    const result = await prisma.task.updateMany({
      where: { id, tenantId },
      data: updateData,
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const updated = await prisma.task.findFirst({ where: { id, tenantId } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params

    const result = await prisma.task.deleteMany({ where: { id, tenantId } })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}