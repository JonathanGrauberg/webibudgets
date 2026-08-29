// app/api/auth/update-email/route.ts
//
// Solo para corregir un typo ANTES de verificar — no es un cambio de
// email general de la cuenta (esta app no tiene esa pantalla en
// Ajustes todavía). Por eso se rechaza si el usuario ya está verificado:
// una vez confirmado el email, cambiarlo es una operación distinta y más
// delicada (implicaría re-verificar, avisar al email viejo, etc.) que
// queda fuera de este flujo puntual.

import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { issueAndSendVerificationEmail } from '@/lib/email-verification'

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: 'No estás logueado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const rawEmail = body?.email

  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const email = rawEmail.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  })

  if (!currentUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (currentUser.emailVerified) {
    return NextResponse.json(
      { error: 'Tu email ya está verificado, no se puede corregir desde acá.' },
      { status: 400 }
    )
  }

  if (email === currentUser.email) {
    return NextResponse.json({ ok: true, email })
  }

  // Mismo chequeo de duplicados que usa el registro
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
  }

  const usedAt = new Date()

  await prisma.$transaction([
    prisma.user.update({ where: { id: currentUser.id }, data: { email } }),
    // 👇 cualquier link de verificación viejo (mandado al email anterior)
    // queda invalidado — ya no correspondería a la dirección correcta
    prisma.emailVerificationToken.updateMany({
      where: { userId: currentUser.id, usedAt: null },
      data: { usedAt },
    }),
  ])

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
  await issueAndSendVerificationEmail(currentUser.id, email, baseUrl)

  return NextResponse.json({ ok: true, email })
}
