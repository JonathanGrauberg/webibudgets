//app\api\cobros\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const cobro = await prisma.cobro.findFirst({
    where: { id, tenantId },
    include: { client: { select: { id: true, name: true, company: true, whatsappNumber: true } } },
  })

  if (!cobro) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }

  return NextResponse.json(cobro)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const existing = await prisma.cobro.findFirst({ where: { id, tenantId } })
    if (!existing) {
      return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.concept !== undefined) updateData.concept = String(data.concept).trim()
    if (data.amount !== undefined) updateData.amount = Number(data.amount)
    if (data.notes !== undefined) updateData.notes = data.notes || null

    const cobro = await prisma.cobro.update({
      where: { id },
      data: updateData,
      include: { client: { select: { id: true, name: true, company: true } } },
    })

    return NextResponse.json(cobro)
  } catch (error) {
    console.error('Error updating cobro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const existing = await prisma.cobro.findFirst({ where: { id, tenantId } })
  if (!existing) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }
  if (existing.status === 'paid') {
    return NextResponse.json({ error: 'No se puede eliminar un cobro ya pagado — es un registro contable' }, { status: 400 })
  }

  await prisma.cobro.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
