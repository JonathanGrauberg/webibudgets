// lib/email.ts
//
// Primer punto de envío de emails transaccionales del sistema — hasta
// ahora .budgets no mandaba ningún email propio. Usa Resend (dominio
// webistudio.net ya verificado). Requiere la env var RESEND_API_KEY; si
// no está seteada (ej. desarrollo local sin configurar), se loguea un
// warning y no se rompe el flujo — el endpoint que llama a esto sigue
// respondiendo igual (ver app/api/auth/forgot-password/route.ts, que
// necesita responder lo mismo exista o no el email para no filtrar nada).

import { Resend } from 'resend'

const EMAIL_FROM = process.env.EMAIL_FROM || 'Webi. Studio Digital <soporte@webistudio.net>'

let resendClient: Resend | null = null
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no está configurada — no se envía el email.')
    return null
  }
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

function emailShell(bodyHtml: string): string {
  return `
  <div style="font-family: Arial, sans-serif; background:#F4F5F7; padding:32px 16px;">
    <div style="max-width:480px; margin:0 auto; background:#FFFFFF; border-radius:12px; padding:32px 28px; border:1px solid #E7E8EC;">
      <div style="font-size:18px; font-weight:800; color:#15171C; letter-spacing:-0.3px; margin-bottom:20px;">.budgets</div>
      ${bodyHtml}
      <p style="font-size:11px; color:#9297A2; margin-top:28px; line-height:1.6;">
        Este es un email automático de .budgets by Webi. Studio Digital. Si no reconocés esta actividad, podés ignorarlo con tranquilidad.
      </p>
    </div>
  </div>`
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const client = getResendClient()
  if (!client) return

  const html = emailShell(`
    <h1 style="font-size:16px; color:#15171C; margin:0 0 12px;">Restablecer tu contraseña</h1>
    <p style="font-size:13.5px; color:#4B4F57; line-height:1.7; margin:0 0 20px;">
      Pediste restablecer la contraseña de tu cuenta en <b>.budgets</b>. Este link es válido por
      <b>1 hora</b> y solo se puede usar una vez.
    </p>
    <a href="${resetUrl}"
      style="display:inline-block; background:#15171C; color:#FFFFFF; text-decoration:none; font-size:13.5px; font-weight:600; padding:11px 22px; border-radius:8px;">
      Elegir nueva contraseña
    </a>
    <p style="font-size:12px; color:#9297A2; line-height:1.7; margin-top:20px;">
      Si vos no pediste este cambio, no hace falta que hagas nada — tu contraseña actual sigue funcionando.
    </p>
  `)

  try {
    await client.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Restablecé tu contraseña de .budgets',
      html,
    })
  } catch (err) {
    console.error('[email] Error enviando email de reset de contraseña:', err)
  }
}

export async function sendGoogleAccountNoticeEmail(to: string) {
  const client = getResendClient()
  if (!client) return

  const html = emailShell(`
    <h1 style="font-size:16px; color:#15171C; margin:0 0 12px;">Tu cuenta usa Google</h1>
    <p style="font-size:13.5px; color:#4B4F57; line-height:1.7; margin:0 0 6px;">
      Pediste restablecer la contraseña de la cuenta de <b>.budgets</b> asociada a este email, pero
      esta cuenta se creó con <b>Google</b> y no tiene una contraseña propia.
    </p>
    <p style="font-size:13.5px; color:#4B4F57; line-height:1.7; margin:0 0 20px;">
      Iniciá sesión con el botón <b>&quot;Iniciar sesión con Google&quot;</b> en la pantalla de login.
    </p>
  `)

  try {
    await client.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Tu cuenta de .budgets usa Google',
      html,
    })
  } catch (err) {
    console.error('[email] Error enviando el aviso de cuenta Google:', err)
  }
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const client = getResendClient()
  if (!client) return

  const html = emailShell(`
    <h1 style="font-size:16px; color:#15171C; margin:0 0 12px;">Confirmá tu email</h1>
    <p style="font-size:13.5px; color:#4B4F57; line-height:1.7; margin:0 0 20px;">
      Ya podés usar <b>.budgets</b> — para crear presupuestos y para pasar al plan PRO más
      adelante, necesitamos que confirmes que este email es tuyo. Este link es válido por
      <b>1 hora</b> y solo se puede usar una vez.
    </p>
    <a href="${verifyUrl}"
      style="display:inline-block; background:#15171C; color:#FFFFFF; text-decoration:none; font-size:13.5px; font-weight:600; padding:11px 22px; border-radius:8px;">
      Confirmar mi email
    </a>
    <p style="font-size:12px; color:#9297A2; line-height:1.7; margin-top:20px;">
      Si no creaste una cuenta en .budgets, podés ignorar este email.
    </p>
  `)

  try {
    await client.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Confirmá tu email de .budgets',
      html,
    })
  } catch (err) {
    console.error('[email] Error enviando el email de verificación:', err)
  }
}
