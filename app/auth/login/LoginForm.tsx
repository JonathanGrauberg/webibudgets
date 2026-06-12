//app\auth\login\LoginForm.tsx
'use client'
 
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

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
      {/* Forma negra decorativa, en línea con el hero de la landing */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-10 shadow-xl"
      >
        {/* Logo mark */}
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background">
          W
        </div>

        <h1 className="mb-1 text-2xl font-semibold text-foreground">Iniciar sesión</h1>
        <p className="mb-8 text-sm text-muted-foreground">Accedé a tu panel de presupuestos</p>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            {error}
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
