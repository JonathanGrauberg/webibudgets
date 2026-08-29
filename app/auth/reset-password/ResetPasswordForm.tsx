'use client'
//app\auth\reset-password\ResetPasswordForm.tsx
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,\-*@#$%^&+=]).{8,}$/
const PASSWORD_REQUIREMENTS_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (ej: .,-*).'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Este link no es válido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".')
      return
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error ?? 'No pudimos restablecer la contraseña')
      }

      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-10 shadow-xl">
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
          .budgets
        </Link>

        <h1 className="mb-2 mt-5 text-sm font-semibold text-foreground">Elegí una nueva contraseña</h1>
        <p className="mb-6 text-xs text-muted-foreground">Tiene que cumplir los mismos requisitos de siempre.</p>

        {done ? (
          <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
            Listo, tu contraseña se actualizó. Te llevamos al login...
          </div>
        ) : !token ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este link no es válido. Pedí uno nuevo desde{' '}
            <Link href="/auth/forgot-password" className="font-semibold underline underline-offset-2">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {error && (
              <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Nueva contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mayús, minús, número y símbolo"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repetila"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-[11px] font-medium text-muted-foreground underline underline-offset-2"
            >
              {showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
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
