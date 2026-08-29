// app/api/auth/resend-verification/route.ts
//
// A diferencia de forgot-password, acá no hay nada que ocultar: quien
// llama ya está logueado como esa cuenta (requiere sesión), así que no
// hace falta la respuesta genérica ni el piso de tiempo — si pegó el
// límite de reenvíos, se lo decimos tal cual.

import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { issueAndSendVerificationEmail } from '@/lib/email-verification'
import { AUTH_EMAIL_TOKEN_TTL_MS, MAX_AUTH_EMAILS_PER_HOUR } from '@/lib/auth-rate-limits'

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: 'No estás logueado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true })
  }

  // 👇 mismo límite que forgot-password (3 por hora, ver lib/auth-rate-limits.ts) —
  // acá sí se lo decimos explícito, porque no hay riesgo de filtrar nada
  // (la persona ya está logueada como su propia cuenta).
  const recentCount = await prisma.emailVerificationToken.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - AUTH_EMAIL_TOKEN_TTL_MS) } },
  })

  if (recentCount >= MAX_AUTH_EMAILS_PER_HOUR) {
    return NextResponse.json(
      { error: 'Ya pediste el máximo de reenvíos por ahora. Esperá un rato y probá de nuevo.' },
      { status: 429 }
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
  await issueAndSendVerificationEmail(user.id, user.email, baseUrl)

  return NextResponse.json({ ok: true })
}
