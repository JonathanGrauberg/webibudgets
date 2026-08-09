import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] // 👈 nuevo

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params
  const data = await request.json()

  const updateData: Record<string, unknown> = {}
  if (typeof data.name === 'string' && data.name.trim()) updateData.name = data.name.trim()
  if (typeof data.order === 'number') updateData.order = data.order
  if (typeof data.priority === 'string' && VALID_PRIORITIES.includes(data.priority)) {
    updateData.priority = data.priority // 👈 nuevo
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const result = await prisma.kioskBoard.updateMany({ where: tenantWhereId(id, tenantId), data: updateData })
  if (result.count === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const board = await prisma.kioskBoard.findFirst({ where: tenantWhereId(id, tenantId) })
  return NextResponse.json(board)
}

export async function DELETE(request: Request, { params }: Params) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  await prisma.task.updateMany({ where: { kioskBoardId: id, tenantId }, data: { kioskBoardId: null } })

  const result = await prisma.kioskBoard.deleteMany({ where: tenantWhereId(id, tenantId) })
  if (result.count === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ success: true })
}