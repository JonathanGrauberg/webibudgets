'use client'
//components\email-verification-banner.tsx
//
// Cartel persistente (no modal) para cuentas con email todavía sin
// confirmar. Lee su propio estado con SWR en vez de confiar en la
// sesión de NextAuth — así, si la persona verifica en otra pestaña o
// vuelve después de tocar el link del email, `revalidateOnFocus` de SWR
// hace que el cartel desaparezca solo, sin pedirle que se deslogueé.

import { useState } from 'react'
import useSWR from 'swr'

type VerificationStatus = {
  email: string
  emailVerified: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function EmailVerificationBanner() {
  const { data, mutate } = useSWR<VerificationStatus>('/api/auth/verification-status', fetcher, {
    revalidateOnFocus: true,
  })

  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [editError, setEditError] = useState('')

  // Todavía no sabemos el estado, o ya está verificado → no mostramos nada
  if (!data || data.emailVerified) return null

  const handleResend = async () => {
    setResending(true)
    setResendMessage('')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResendMessage(body?.error ?? 'No pudimos reenviar el email')
      } else {
        setResendMessage('Listo, te reenviamos el email de confirmación.')
      }
    } catch {
      setResendMessage('No pudimos reenviar el email. Probá de nuevo en un rato.')
    } finally {
      setResending(false)
    }
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')
    setSavingEmail(true)
    try {
      const res = await fetch('/api/auth/update-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEditError(body?.error ?? 'No pudimos actualizar el email')
        return
      }
      setEditing(false)
      setNewEmail('')
      setResendMessage('Listo, te mandamos un nuevo link de confirmación a la dirección corregida.')
      await mutate()
    } catch {
      setEditError('No pudimos actualizar el email. Probá de nuevo en un rato.')
    } finally {
      setSavingEmail(false)
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <span className="font-semibold">Confirmá tu email</span>{' '}
            <span>({data.email})</span> para poder crear presupuestos y pasar al plan PRO.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="rounded-full bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
          >
            {resending ? 'Enviando...' : 'Reenviar email'}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-xs font-medium underline underline-offset-2"
          >
            ¿Es incorrecto? Corregilo
          </button>
        </div>
      </div>

      {resendMessage && <p className="mt-1.5 text-xs">{resendMessage}</p>}

      {editing && (
        <form onSubmit={handleSaveEmail} className="mt-2.5 flex flex-wrap items-center gap-2">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email-correcto@ejemplo.com"
            disabled={savingEmail}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs text-foreground outline-none focus:border-amber-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={savingEmail}
            className="rounded-full bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
          >
            {savingEmail ? 'Guardando...' : 'Guardar'}
          </button>
          {editError && <span className="text-xs text-red-700">{editError}</span>}
        </form>
      )}

      <p className="mt-1.5 text-[11px] text-amber-800/70 dark:text-amber-300/60">
        Si necesitás recuperar tu contraseña más adelante, te la mandamos a este mismo email —
        asegurate de que esté bien escrito.
      </p>
    </div>
  )
}
