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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0c29]">
      {/* Orbs de fondo */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-indigo-500 opacity-30 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-violet-500 opacity-30 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-10 left-16 h-36 w-36 rounded-full bg-cyan-400 opacity-25 blur-[60px]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.08] p-10 shadow-2xl backdrop-blur-xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)' }}
      >
        {/* Logo mark */}
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg">
          W
        </div>

        <h1 className="mb-1 text-2xl font-semibold text-white">Iniciar sesión</h1>
        <p className="mb-8 text-sm text-white/50">Accedé a tu panel de presupuestos</p>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm text-red-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/50">
            Email
          </label>
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-indigo-400/70 focus:bg-white/10"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-white/50">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-indigo-400/70 focus:bg-white/10"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}