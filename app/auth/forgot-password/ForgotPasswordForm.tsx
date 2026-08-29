'use client'
//app\auth\forgot-password\ForgotPasswordForm.tsx
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
    } catch {
      // 👇 el mensaje que se muestra es siempre el mismo, exista o no el
      // email, ande bien o mal la red — no hay nada que distinguir acá.
    }

    // 👇 no leemos el resultado más allá de que la request terminó: la
    // pantalla siempre muestra el mismo mensaje genérico (ver route.ts).
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-10 shadow-xl">
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
          .budgets
        </Link>

        <h1 className="mb-2 mt-5 text-sm font-semibold text-foreground">¿Olvidaste tu contraseña?</h1>
        <p className="mb-6 text-xs text-muted-foreground">
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </p>

        {sent ? (
          <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
            Si existe una cuenta con ese email, te enviamos un link para restablecer la contraseña.
            Revisá tu bandeja de entrada (y spam, por las dudas).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-2">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
