// lib/email-verification.ts
//
// Un solo lugar para "generar el token y mandar el email de verificación"
// — lo llaman tres puntos distintos (alta de cuenta, reenvío manual, y
// corrección de email), y los tres necesitan hacer exactamente lo mismo.
// Mismo patrón que el token de reseteo de contraseña: se guarda el hash
// sha256, nunca el token en texto plano.
//
// Nunca tira: si Resend falla o la env var no está configurada, queda
// logueado (ver lib/email.ts) pero no rompe el flujo que lo llama — no
// tiene sentido que un problema de envío de email tire abajo un alta de
// cuenta o un cambio de email que ya se guardó bien en la base.

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { AUTH_EMAIL_TOKEN_TTL_MS } from '@/lib/auth-rate-limits'

export async function issueAndSendVerificationEmail(
  userId: string,
  email: string,
  baseUrl: string
): Promise<void> {
  try {
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + AUTH_EMAIL_TOKEN_TTL_MS),
      },
    })

    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`
    await sendVerificationEmail(email, verifyUrl)
  } catch (err) {
    console.error('[email-verification] No se pudo generar/enviar el token:', err)
  }
}
