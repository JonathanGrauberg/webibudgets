// app/api/suggestions/route.ts
//
// Botón "Sugerencias" del widget de ayuda — manda un mail a la casilla
// del producto (puntobudgets@gmail.com por default) con reply-to al
// usuario, para poder contestarle directo.
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { sendSuggestionEmail } from '@/lib/email'

const MAX_MESSAGE_LENGTH = 2000

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.sub || !token.tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const data = await req.json().catch(() => ({}))
  const message = String(data?.message ?? '').trim()

  if (!message) {
    return NextResponse.json({ error: 'Falta el mensaje' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `El mensaje es demasiado largo (máx. ${MAX_MESSAGE_LENGTH} caracteres)` }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub as string },
    select: { name: true, email: true, tenant: { select: { name: true } } },
  })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  try {
    await sendSuggestionEmail({
      userName: user.name,
      userEmail: user.email,
      tenantName: user.tenant?.name ?? '—',
      message,
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo enviar la sugerencia. Probá de nuevo en un rato.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
