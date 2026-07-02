'use client'
//app\auth\login\LoginForm.tsx:
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
    detail: 'Activá tu plan para seguir usando .budgets by Webi.',
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false) // 🌟 Estado de carga para Google
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

  // 🌟 Acción Real de Google para Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: callbackUrl ?? '/dashboard' })
    } catch (err) {
      console.error('[google-login-error]', err)
      setIsGoogleLoading(false)
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

        <h1 className="mb-5 mt-5 text-sm font-semibold text-foreground">Iniciar sesión</h1>
        <p className="mb-6 text-xs text-muted-foreground">Accedé a tu panel de presupuestos</p>

        {/* 🔘 Botón de Google Funcional */}
        <button
          type="button"
          disabled={loading || isGoogleLoading}
          onClick={handleGoogleLogin}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.56 14.96 1 12 1 7.36 1 3.4 3.68 1.4 7.6l3.8 2.96c.92-2.76 3.52-4.52 6.8-4.52z"/>
            <path fill="#4285F4" d="M23.48 12.28c0-.84-.08-1.64-.24-2.44H12v4.56h6.48c-.28 1.48-1.12 2.72-2.36 3.56l3.68 2.84c2.16-2 3.4-4.96 3.4-8.52z"/>
            <path fill="#FBBC05" d="M5.2 14.44c-.24-.72-.36-1.48-.36-2.28s.12-1.56.36-2.28L1.4 6.92C.52 8.68 0 10.28 0 12s.52 3.32 1.4 5.08l3.8-2.64z"/>
            <path fill="#34A353" d="M12 23c3.24 0 5.96-1.08 7.96-2.92l-3.68-2.84c-1.04.68-2.36 1.12-4.28 1.12-3.28 0-5.88-1.76-6.8-4.52l-3.8 2.96C3.4 20.32 7.36 23 12 23z"/>
          </svg>
          {isGoogleLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
        </button>

        {/* Separador estético */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <span className="relative bg-card px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">O con email</span>
        </div>

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
              disabled={loading || isGoogleLoading}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || isGoogleLoading}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 mt-2"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link href="/auth/register" className="font-medium text-foreground underline underline-offset-2">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}