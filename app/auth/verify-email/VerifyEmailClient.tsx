'use client'
//app\auth\verify-email\VerifyEmailClient.tsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'checking' | 'ok' | 'error'

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Este link no es válido. Pedí uno nuevo desde el cartel de tu cuenta.')
      return
    }

    let cancelled = false

    // 👇 Nota: al ser un fetch automático apenas se abre la página, un
    // escáner de links de algún proveedor de email corporativo podría en
    // teoría "gastar" el token antes de que la persona lo abra a propósito.
    // Es un trade-off conocido de este patrón — si en la práctica genera
    // quejas de "el link ya estaba usado", el siguiente paso es sumar un
    // botón de confirmación manual en vez de disparar el fetch solo.
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (cancelled) return
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data?.error ?? 'No pudimos verificar tu email')
          setStatus('error')
          return
        }
        setStatus('ok')
      })
      .catch(() => {
        if (cancelled) return
        setError('No pudimos verificar tu email. Probá de nuevo en un rato.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-foreground/[0.04]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-foreground/[0.04]" />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-card p-10 shadow-xl text-center">
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
          .budgets
        </Link>

        <div className="mt-6">
          {status === 'checking' && (
            <p className="text-sm text-muted-foreground">Verificando tu email...</p>
          )}

          {status === 'ok' && (
            <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
              Listo, tu email quedó confirmado. Ya podés crear presupuestos sin restricciones.
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {error}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/dashboard" className="font-medium text-foreground underline underline-offset-2">
            Ir al panel
          </Link>
        </p>
      </div>
    </div>
  )
}
