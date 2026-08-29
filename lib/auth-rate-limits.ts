// lib/auth-rate-limits.ts
//
// Un solo lugar para el límite de "cuántos emails de un solo uso le
// podés mandar a la misma cuenta por hora" — lo comparten forgot-password
// (reseteo de contraseña) y resend-verification (verificación de email),
// así el criterio queda parejo en los dos flujos y no hay que acordarse
// de tocar dos números si el día de mañana cambia.

export const AUTH_EMAIL_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora — vencimiento del token
export const MAX_AUTH_EMAILS_PER_HOUR = 3 // 👈 límite anti-spam por usuario
