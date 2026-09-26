// lib/recaptcha.ts
//
// Verificación de Google reCAPTCHA v3 — invisible, sin desafío para el
// usuario: solo devuelve un puntaje (0 a 1) de qué tan humano parece el
// pedido. Requiere las env vars NEXT_PUBLIC_RECAPTCHA_SITE_KEY (pública,
// para el script del cliente) y RECAPTCHA_SECRET_KEY (server-only, para
// verificar acá). Si no están configuradas todavía, no bloqueamos el
// registro — solo logueamos un aviso, mismo criterio que lib/email.ts con
// RESEND_API_KEY.
const MIN_SCORE = 0.5

export async function verifyRecaptcha(token: string | undefined | null, expectedAction: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY no está configurada — no se verifica (dejamos pasar).')
    return true
  }

  if (!token) return false

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = await res.json()

    if (!data.success) return false
    if (data.action !== expectedAction) return false
    if (typeof data.score === 'number' && data.score < MIN_SCORE) return false

    return true
  } catch (err) {
    console.error('[recaptcha] Error verificando token:', err)
    // 👇 si Google está caído, no le cortamos el registro a gente real por eso
    return true
  }
}
