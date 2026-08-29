// app/api/auth/verify-email/route.ts
//
// A diferencia de forgot-password, acá no hace falta ocultar nada: el
// token en sí es la credencial (nadie más lo tiene salvo quien recibió
// el email), así que está bien decir explícitamente si venció o ya se
// usó — es justo lo que la persona necesita saber para pedir uno nuevo.
// Sin sesión requerida: el link puede abrirse desde cualquier dispositivo,
// incluso sin estar logueado.

import { NextResponse, NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const token = body?.token

    if (typeof token !== 'string' || !token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    })

    const isExpiredOrUsed =
      !verificationToken ||
      !!verificationToken.usedAt ||
      verificationToken.expiresAt.getTime() < Date.now()

    if (isExpiredOrUsed) {
      return NextResponse.json(
        { error: 'Este link venció o ya fue usado. Pedí uno nuevo desde el cartel de tu cuenta.' },
        { status: 400 }
      )
    }

    const usedAt = new Date()

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: usedAt },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt },
      }),
      // 👇 cualquier otro link de verificación pendiente para este usuario
      // (ej. de un reenvío anterior) queda invalidado también
      prisma.emailVerificationToken.updateMany({
        where: { userId: verificationToken.userId, usedAt: null, id: { not: verificationToken.id } },
        data: { usedAt },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
