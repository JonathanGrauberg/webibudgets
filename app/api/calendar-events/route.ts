// app/api/calendar-events/route.ts
//
// Calendario compartido de la empresa — lo ve cualquiera con acceso al
// sistema, pero solo Owner/Admin/Vendedor pueden crear anotaciones (ver
// lib/permissions.ts, EditScope 'calendar'). Cada anotación guarda el rol
// del autor "congelado" al crearla (authorRole) — define el color en la
// UI y no cambia aunque después le cambien el rol al usuario.
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { canAccessRoute, canEdit } from '@/lib/permissions'

const MAX_TITLE_LENGTH = 200
const MAX_NOTES_LENGTH = 2000

function normalizeAuthorRole(role: string): 'admin' | 'seller' {
  return role === 'owner' || role === 'admin' ? 'admin' : 'seller'
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined
  if (!tenantId || !canAccessRoute(role, 'calendar')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const events = await prisma.calendarEvent.findMany({
    where: {
      tenantId,
      ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined
  const userId = token?.id as string | undefined
  if (!tenantId || !userId || !canEdit(role, 'calendar')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const data = await req.json().catch(() => ({}))
  const title = String(data?.title ?? '').trim()
  const notes = data?.notes ? String(data.notes).trim() : null
  const dateRaw = data?.date
  const time = data?.time ? String(data.time).trim() : null

  if (!title) {
    return NextResponse.json({ error: 'Falta el título' }, { status: 400 })
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `El título es muy largo (máx. ${MAX_TITLE_LENGTH} caracteres)` }, { status: 400 })
  }
  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: `La nota es muy larga (máx. ${MAX_NOTES_LENGTH} caracteres)` }, { status: 400 })
  }
  const date = new Date(dateRaw)
  if (!dateRaw || isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const event = await prisma.calendarEvent.create({
    data: {
      tenantId,
      title,
      notes,
      date,
      time,
      createdByUserId: userId,
      authorName: user.name,
      authorRole: normalizeAuthorRole(role!),
    },
  })

  return NextResponse.json(event, { status: 201 })
}
