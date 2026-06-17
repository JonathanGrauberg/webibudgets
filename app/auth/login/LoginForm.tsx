// app/auth/login/LoginForm.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, { title: string; detail: string }> = {
  CredentialsSignin: {
    title: 'Credenciales incorrectas',
    detail: 'El email o la contraseña no son válidos.',
  },
  trial_expired: {
    title: 'Tu período de prueba venció',
    detail: 'Activá tu plan para seguir usando WebiBudgets.',
  },
  tenant_inactive: {
    title: 'Cuenta suspendida',
    detail: 'Tu cuenta fue desactivada. Contactá a soporte.',
  },
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

  // Errores que vienen por URL (?error=trial_expired)
  const urlError = searchParams.get('error')
  const displayError = error || urlError || ''
  const errorInfo = ERROR_MESSAGES[displayError] ?? {
    title: 'Error',
    detail: displayError,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const defaultRedirect = '/dashboard'
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl ?? defaultRedirect,
    })

    if (res?.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    let target = callbackUrl ?? defaultRedirect

    if (!callbackUrl) {
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json().catch(() => null)
      if (sessionData?.user?.role === 'owner') target = '/admin'
    }

    router.push(target)
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-10 shadow-xl"
      >
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
          .Budgets
        </Link>

        <h1 className="mb-5 mt-5 text-sm font-semibold text-foreground">Iniciar sesión</h1>
        <p className="mb-8 text-sm text-muted-foreground">Accedé a tu panel de presupuestos</p>

        {displayError && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            displayError === 'trial_expired'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-border bg-secondary text-foreground'
          }`}>
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42z" />
              </svg>
              <div>
                <p className="font-semibold">{errorInfo.title}</p>
                <p className="mt-0.5 text-xs opacity-80">{errorInfo.detail}</p>
                {displayError === 'trial_expired' && (
                  <Link
                    href="/pricing"
                    className="mt-2 inline-block rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition"
                  >
                    Ver planes →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}