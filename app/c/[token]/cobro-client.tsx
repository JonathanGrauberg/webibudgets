'use client'
//app\c\[token]\cobro-client.tsx
//
// Portal público de un Cobro — versión simple (no hay PDF/plantilla de por
// medio como con los presupuestos): tarjeta con el concepto, el monto y el
// botón de pago.

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/format'

type PublicCobroData = {
  cobroNumber: number
  concept: string
  amount: number
  currency: string
  status: 'pending' | 'paid'
  periodMonth: string
  client: { name: string; company: string | null } | null
  tenant: { name: string; logoUrl: string | null; primaryColor: string | null }
  showFooterBranding: boolean
  canPay: boolean
}

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 30

function periodLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  } catch {
    return ''
  }
}

export function CobroPortalClient({ token }: { token: string }) {
  const searchParams = useSearchParams()
  const pagoParam = searchParams.get('pago')

  const [data, setData] = useState<PublicCobroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const [polling, setPolling] = useState(pagoParam === 'exito' || pagoParam === 'pendiente')
  const pollCount = useRef(0)

  useEffect(() => {
    fetch(`/api/public/cobros/${token}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .then((json) => json && setData(json))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      pollCount.current += 1
      const res = await fetch(`/api/public/cobros/${token}/status`).catch(() => null)
      if (res?.ok) {
        const status = await res.json()
        setData((prev) => (prev ? { ...prev, status: status.status } : prev))
        if (status.status === 'paid') setPolling(false)
      }
      if (pollCount.current >= POLL_MAX_ATTEMPTS) setPolling(false)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [polling, token])

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetch(`/api/public/cobros/${token}/pay`, { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.url) {
        alert(json?.error ?? 'No pudimos generar el link de pago')
        setPaying(false)
        return
      }
      window.location.href = json.url
    } catch {
      alert('No pudimos generar el link de pago')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">No encontramos este cobro</p>
          <p className="mt-1 text-sm text-slate-500">El link puede ser incorrecto.</p>
        </div>
      </div>
    )
  }

  const primary = data.tenant.primaryColor || '#0f172a'

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
            {data.tenant.logoUrl ? (
              <img src={data.tenant.logoUrl} alt={data.tenant.name} className="h-11 w-11 rounded-xl object-contain" />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold text-white"
                style={{ backgroundColor: primary }}
              >
                {data.tenant.name?.[0]?.toUpperCase() ?? '.'}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">{data.tenant.name}</p>
              <p className="text-xs text-slate-500">Cobro #{String(data.cobroNumber).padStart(6, '0')} · {periodLabel(data.periodMonth)}</p>
            </div>
          </div>

          <div className="px-6 py-6 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {data.client?.company || data.client?.name || 'Cliente'}
            </p>
            <p className="mt-1 text-base font-medium text-slate-800">{data.concept}</p>
            <p className="mt-4 text-3xl font-bold" style={{ color: primary }}>
              {formatCurrency(data.amount, data.currency)}
            </p>

            {data.status === 'paid' ? (
              <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                ✓ Ya está pagado — ¡gracias!
              </div>
            ) : (
              <>
                {polling && (
                  <p className="mt-4 text-xs text-slate-400">
                    El pago se está confirmando, puede demorar unos minutos.
                  </p>
                )}
                {pagoParam === 'fallo' && (
                  <p className="mt-4 text-xs text-red-500">
                    El pago no se completó. Podés intentarlo de nuevo.
                  </p>
                )}
                {data.canPay && (
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={paying}
                    className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                    style={{ backgroundColor: '#0038ff' }}
                  >
                    {paying ? 'Generando link de pago...' : 'Pagar con Mercado Pago'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {data.showFooterBranding && (
          <a
            href="https://budgets.webistudio.net"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            ¿Te gustaría un sistema de cobros como este para tu negocio? Conocé <span className="font-semibold">.budgets</span> →
          </a>
        )}
      </div>
    </div>
  )
}
