// app/api/calendar-events/[id]/route.ts
//
// Editar/borrar una anotación — solo quien la creó, sin importar el rol
// (ni un admin puede tocar la de un vendedor, y viceversa — a propósito,
// ver conversación: "lo justo es que nadie más lo toque, ni siquiera otro admin").
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const MAX_TITLE_LENGTH = 200
const MAX_NOTES_LENGTH = 2000

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const userId = token?.id as string | undefined
  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.calendarEvent.findFirst({ where: { id, tenantId } })
  if (!existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (existing.createdByUserId !== userId) {
    return NextResponse.json({ error: 'Solo quien creó esta anotación puede editarla' }, { status: 403 })
  }

  const data = await req.json().catch(() => ({}))
  const updateData: Record<string, unknown> = {}

  if (data.title !== undefined) {
    const title = String(data.title).trim()
    if (!title) return NextResponse.json({ error: 'Falta el título' }, { status: 400 })
    if (title.length > MAX_TITLE_LENGTH) return NextResponse.json({ error: `El título es muy largo (máx. ${MAX_TITLE_LENGTH} caracteres)` }, { status: 400 })
    updateData.title = title
  }
  if (data.notes !== undefined) {
    const notes = data.notes ? String(data.notes).trim() : null
    if (notes && notes.length > MAX_NOTES_LENGTH) return NextResponse.json({ error: `La nota es muy larga (máx. ${MAX_NOTES_LENGTH} caracteres)` }, { status: 400 })
    updateData.notes = notes
  }
  if (data.date !== undefined) {
    const date = new Date(data.date)
    if (isNaN(date.getTime())) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    updateData.date = date
  }
  if (data.time !== undefined) {
    updateData.time = data.time ? String(data.time).trim() : null
  }

  const updated = await prisma.calendarEvent.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const userId = token?.id as string | undefined
  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.calendarEvent.findFirst({ where: { id, tenantId } })
  if (!existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  if (existing.createdByUserId !== userId) {
    return NextResponse.json({ error: 'Solo quien creó esta anotación puede borrarla' }, { status: 403 })
  }

  await prisma.calendarEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
