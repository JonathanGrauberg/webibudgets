// app/api/auth/forgot-password/route.ts
//
// Pide el email y siempre responde EXACTAMENTE lo mismo, exista o no una
// cuenta con ese email — así nadie puede usar este endpoint para
// averiguar qué emails están registrados. Toda la lógica que sí varía
// (mandar el link, avisar que la cuenta es de Google, no hacer nada si
// el email no existe) pasa puertas adentro, nunca en la respuesta HTTP.
//
// También se pareja el tiempo de respuesta a un mínimo fijo (ver
// MIN_RESPONSE_MS) — sin esto, la rama "el email existe" tarda más
// (hash + insert + llamada a Resend) que la rama "no existe" (nada), y
// esa diferencia de tiempo es, en sí misma, una forma de filtrar qué
// emails están registrados.

import { NextResponse, NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail, sendGoogleAccountNoticeEmail } from '@/lib/email'
import { AUTH_EMAIL_TOKEN_TTL_MS, MAX_AUTH_EMAILS_PER_HOUR } from '@/lib/auth-rate-limits'

const TOKEN_TTL_MS = AUTH_EMAIL_TOKEN_TTL_MS // 1 hora
const MAX_REQUESTS_PER_HOUR = MAX_AUTH_EMAILS_PER_HOUR // 👈 límite anti-spam por usuario, compartido con la verificación de email
const MIN_RESPONSE_MS = 400

const GENERIC_MESSAGE =
  'Si existe una cuenta con ese email, te enviamos un link para restablecer la contraseña.'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  const respond = async () => {
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed)
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  }

  try {
    const body = await req.json().catch(() => null)
    const rawEmail = body?.email

    if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
      // Ni siquiera esto lo distinguimos — un email vacío también recibe
      // la respuesta genérica, para no dar ninguna pista de validación.
      return respond()
    }

    const email = rawEmail.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return respond()
    }

    // 👇 cuenta creada solo con Google — no tiene contraseña que resetear
    if (!user.password) {
      await sendGoogleAccountNoticeEmail(user.email)
      return respond()
    }

    // 👇 límite de pedidos por hora, por usuario — evita spamear la
    // casilla de un cliente si alguien le pica el botón sin parar
    const recentCount = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - TOKEN_TTL_MS) } },
    })

    if (recentCount >= MAX_REQUESTS_PER_HOUR) {
      return respond()
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

    await sendPasswordResetEmail(user.email, resetUrl)

    return respond()
  } catch (err) {
    console.error('[forgot-password]', err)
    // 👇 misma respuesta también ante un error interno — no hay ninguna
    // rama de este endpoint que devuelva algo distinto al caso genérico.
    return respond()
  }
}
