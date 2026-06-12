'use client'
// app/(public)/register/RegisterForm.tsx

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { PLAN_LIMITS, type PlanKey } from '@/lib/plan'

const MIN_PASSWORD_LENGTH = 8

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = (searchParams.get('plan') ?? 'free') as PlanKey
  const selectedPlan = PLAN_LIMITS[planParam] ?? PLAN_LIMITS.free
  const isPaidPlan = planParam !== 'free'

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'redirecting'>('form')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // 1. Crear tenant + usuario
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyName, email, password, plan: planParam }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerData?.error ?? 'Error al crear la cuenta')
      }

      const { tenantId } = registerData

      // 2. Auto-login
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        throw new Error('Cuenta creada, pero error al iniciar sesión. Intentá desde /auth/login')
      }

      // 3. Si eligió plan pago → ir a MercadoPago
      if (isPaidPlan) {
        setStep('redirecting')

        const checkoutRes = await fetch('/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan: planParam, tenantId }),
        })

        const checkoutData = await checkoutRes.json()

        if (!checkoutRes.ok || !checkoutData.checkoutUrl) {
          // Si falla MP, igual dejamos entrar — el trial cubre
          router.push('/dashboard?subscription=pending')
          return
        }

        window.location.href = checkoutData.checkoutUrl
        return
      }

      // 4. Plan free → directo al dashboard
      router.push('/dashboard?welcome=1')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setIsSubmitting(false)
      setStep('form')
    }
  }

  if (step === 'redirecting') {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background mx-auto">
            W
          </div>
          <p className="text-lg font-semibold text-foreground">Redirigiendo a MercadoPago...</p>
          <p className="text-sm text-muted-foreground">Tu cuenta ya fue creada. Completá el pago para activar el plan {selectedPlan.label}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorativos */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card p-10 shadow-xl">
          {/* Logo */}
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-lg font-bold text-background">
            W
          </div>

          <h1 className="mb-1 text-2xl font-semibold text-foreground">Crear cuenta</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {isPaidPlan
              ? `Plan ${selectedPlan.label} · ${selectedPlan.price}/mes`
              : '14 días gratis, sin tarjeta'}
          </p>

          {/* Plan badge */}
          {isPaidPlan && (
            <div className="mb-6 rounded-xl border border-border bg-secondary px-4 py-3">
              <p className="text-xs font-semibold text-foreground">{selectedPlan.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedPlan.description}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Nombre de la empresa
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme S.A."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                autoComplete="off"
                name="register-email"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Contraseña
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  name="register-password"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {isSubmitting
                ? 'Creando cuenta...'
                : isPaidPlan
                  ? `Crear cuenta e ir a pagar`
                  : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-2">
              Iniciá sesión
            </Link>
          </p>

          {isPaidPlan && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Después del registro vas a ser redirigido a MercadoPago para completar el pago.
            </p>
          )}
        </div>

        {/* Link a pricing */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/pricing" className="underline underline-offset-2">
            Ver todos los planes
          </Link>
        </p>
      </div>
    </div>
  )
}