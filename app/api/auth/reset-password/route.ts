// app/api/auth/reset-password/route.ts
//
// A diferencia de forgot-password, acá SÍ está bien decir explícitamente
// si el token es inválido/vencido/usado — ya no estamos hablando de "qué
// email existe", sino de "este link ya no sirve", que es información que
// el dueño del link necesita para saber que tiene que pedir uno nuevo.
//
// Al resetear con éxito: se marca el token usado y se invalidan (mismo
// timestamp de uso) todos los demás tokens vigentes del usuario, así un
// link viejo que quedó dando vueltas en una casilla de email no sirve
// más después de un reset exitoso.

import { NextResponse, NextRequest } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '@/lib/password'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const token = body?.token
    const password = body?.password

    if (typeof token !== 'string' || !token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ error: PASSWORD_REQUIREMENTS_MESSAGE }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    const isExpiredOrUsed =
      !resetToken || !!resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()

    if (isExpiredOrUsed) {
      return NextResponse.json(
        { error: 'Este link venció o ya fue usado. Pedí uno nuevo.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const usedAt = new Date()

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      // El propio token usado
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt },
      }),
      // Cualquier otro token vigente del mismo usuario queda invalidado
      prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null, id: { not: resetToken.id } },
        data: { usedAt },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
