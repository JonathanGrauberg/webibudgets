'use client'
//app\(public)\register\RegisterForm.tsx
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { PLAN_LIMITS, type PlanKey } from '@/lib/plan'

const MIN_PASSWORD_LENGTH = 8

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const planParam = (searchParams.get('plan') ?? 'free') as PlanKey
  const selectedPlan = PLAN_LIMITS[planParam] ?? PLAN_LIMITS.free

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'redirecting'>('form')

    useEffect(() => {
      if (status === 'authenticated' && session?.user) {
        const userPlan = (session.user as any).plan ?? 'starter'
        const trialEndsAt = (session.user as any).trialEndsAt
        const isInActiveTrial = trialEndsAt && new Date(trialEndsAt) > new Date()

        if (isInActiveTrial) {
          router.replace('/dashboard?welcome=1') // ← el modal welcome lo maneja el dashboard
        } else if (userPlan === 'vip' || userPlan === 'business') {
          router.replace('/dashboard')
        } else {
          router.replace('/dashboard?subscription=pending')
        }
      }
    }, [status, session, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  function validatePassword(pass: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,\-*@#$%^&+=]).{8,}$/
    return regex.test(pass)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()

    if (!validatePassword(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (ej: .,-*).')
      return
    }

    setIsSubmitting(true)

    try {
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          companyName: companyName.trim(), 
          email: cleanEmail, 
          password, 
          plan: planParam 
        }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerData?.error ?? 'Error al crear la cuenta')
      }

      const { tenantId } = registerData

      const signInRes = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        throw new Error('Cuenta creada. Iniciá sesión en /auth/login')
      }

      if (planParam !== 'free') {
        setStep('redirecting')

        const checkoutRes = await fetch('/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan: planParam, tenantId }),
        })

        const checkoutData = await checkoutRes.json()

        if (!checkoutRes.ok || !checkoutData.checkoutUrl) {
          router.push('/dashboard?subscription=pending')
          return
        }

        window.location.href = checkoutData.checkoutUrl
        return
      }

      router.push('/dashboard?welcome=1')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setIsSubmitting(false)
      setStep('form')
    }
  }

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard?welcome=1' })
    } catch (err) {
      console.error('[google-register-error]', err)
      setIsGoogleLoading(false)
    }
  }

  if (step === 'redirecting') {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tighter text-black leading-none">
            Webi <span className="text-primary">Budgets</span>
          </h1>
          <p className="text-lg font-semibold text-foreground">Redirigiendo a MercadoPago...</p>
          <p className="text-sm text-muted-foreground">
            Tu cuenta ya fue creada. Completá el pago para activar el plan {selectedPlan.label}.
          </p>
        </div>
      </div>
    )
  }

  // 🔒 Detectamos si el error guardado en el estado coincide con la respuesta del mail duplicado
  const isDuplicateAccountError = error === 'La cuenta ya existe, debes iniciar sesion'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card p-10 shadow-xl">
          <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
            .budgets
          </Link>

          <h1 className="mt-5 mb-2 text-sm font-semibold text-foreground">Crear cuenta</h1>
          <p className="mb-6 text-xs text-muted-foreground">
            {planParam !== 'free' ? `Plan ${selectedPlan.label} · ${selectedPlan.price}/mes` : '14 días gratis, sin tarjeta de crédito'}
          </p>

          <button
            type="button"
            disabled={isSubmitting || isGoogleLoading}
            onClick={handleGoogleRegister}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.56 14.96 1 12 1 7.36 1 3.4 3.68 1.4 7.6l3.8 2.96c.92-2.76 3.52-4.52 6.8-4.52z"/>
              <path fill="#4285F4" d="M23.48 12.28c0-.84-.08-1.64-.24-2.44H12v4.56h6.48c-.28 1.48-1.12 2.72-2.36 3.56l3.68 2.84c2.16-2 3.4-4.96 3.4-8.52z"/>
              <path fill="#FBBC05" d="M5.2 14.44c-.24-.72-.36-1.48-.36-2.28s.12-1.56.36-2.28L1.4 6.92C.52 8.68 0 10.28 0 12s.52 3.32 1.4 5.08l3.8-2.64z"/>
              <path fill="#34A353" d="M12 23c3.24 0 5.96-1.08 7.96-2.92l-3.68-2.84c-1.04.68-2.36 1.12-4.28 1.12-3.28 0-5.88-1.76-6.8-4.52l-3.8 2.96C3.4 20.32 7.36 23 12 23z"/>
            </svg>
            {isGoogleLoading ? 'Conectando...' : 'Registrarse con Google'}
          </button>

          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <span className="relative bg-card px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">O con email</span>
          </div>

          {/* 🌟 Renderizado Condicional del Mensaje de Error */}
          {error && (
            isDuplicateAccountError ? (
              // Cartel Premium / Advertencia amable si la cuenta ya existe
              <div className="mb-5 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-3 text-xs text-amber-800 dark:text-amber-400">
                <span className="font-semibold">La cuenta ya existe en nuestro sistema.</span>
                <p>No necesitas crear un nuevo tenant. Podés iniciar sesión directamente con tus accesos de siempre.</p>
                <Link 
                  href="/auth/login" 
                  className="mt-1 font-bold underline text-amber-900 dark:text-amber-300 hover:opacity-80 transition flex items-center gap-1"
                >
                  Ir a Iniciar Sesión →
                </Link>
              </div>
            ) : (
              // Bloque por defecto para otros errores de validación
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Nombre de la empresa
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting || isGoogleLoading}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme S.A."
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                disabled={isSubmitting || isGoogleLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
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
                  disabled={isSubmitting || isGoogleLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mayús, minús, número y símbolo"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-foreground disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={isSubmitting || isGoogleLoading}
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-xl border border-border px-3 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Creando cuenta...' : planParam !== 'free' ? `Crear cuenta e ir a pagar` : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-2">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}