'use client'
//app\p\[token]\portal-client.tsx
//
// Parte interactiva del portal público — separada de page.tsx porque esa
// ahora es un Server Component (necesita serlo para poder generar los
// meta tags de Open Graph con los datos reales del presupuesto antes de
// que WhatsApp la vea).

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { PAYMENT_STATE_LABEL, type PaymentState } from '@/lib/budget-payments'

type PublicBudgetData = {
  budgetNumber: number | null
  currency: string
  showFooterBranding: boolean
  depositEnabled: boolean
  payment: {
    paid: number
    remaining: number
    state: PaymentState
    depositAmount: number | null
    suggestedAmount: number
  }
  canPay: boolean
}

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 30 // ~1 minuto

export function PublicBudgetPortalClient({ token }: { token: string }) {
  const searchParams = useSearchParams()
  const pagoParam = searchParams.get('pago') // 'exito' | 'pendiente' | 'fallo'

  // 👇 el "documento" en sí ya no se re-arma a mano en React — se muestra
  // el HTML real del PDF adentro de un iframe (mismo motor, así nunca se
  // desincroniza de lo que el cliente descarga), y este estado solo
  // acompaña el alto dinámico del iframe según su contenido.
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(500)

  function handleIframeLoad() {
    try {
      const doc = iframeRef.current?.contentWindow?.document
      if (doc) setIframeHeight(doc.documentElement.scrollHeight + 24)
    } catch {}
  }

  const [data, setData] = useState<PublicBudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const [polling, setPolling] = useState(pagoParam === 'exito' || pagoParam === 'pendiente')
  const pollCount = useRef(0)

  async function loadBudget() {
    try {
      const res = await fetch(`/api/public/budgets/${token}`)
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const json = await res.json()
      setData(json)
      return json as PublicBudgetData
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // 👇 Polling tras volver de Mercado Pago — el webhook puede tardar unos
  // segundos en impactar el pago, así que refrescamos solos en vez de
  // dejar al cliente mirando un estado desactualizado.
  useEffect(() => {
    if (!polling) return

    const interval = setInterval(async () => {
      pollCount.current += 1
      const res = await fetch(`/api/public/budgets/${token}/status`).catch(() => null)
      if (res?.ok) {
        const status = await res.json()
        setData((prev) => (prev ? { ...prev, payment: { ...prev.payment, ...status } } : prev))
        if (status.state === 'paid' || status.state === 'partial') {
          setPolling(false)
        }
      }
      if (pollCount.current >= POLL_MAX_ATTEMPTS) {
        setPolling(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [polling, token])

  async function handlePay(kind?: 'deposit' | 'total') {
    setPaying(true)
    try {
      const res = await fetch(`/api/public/budgets/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
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
        <p className="text-sm text-slate-400">Cargando presupuesto...</p>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">No encontramos este presupuesto</p>
          <p className="mt-1 text-sm text-slate-500">El link puede haber vencido o ser incorrecto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Documento — el HTML real del PDF, embebido tal cual */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
            ref={iframeRef}
            src={`/api/public/budgets/${token}/html`}
            onLoad={handleIframeLoad}
            title={`Presupuesto #${String(data.budgetNumber ?? 0).padStart(6, '0')}`}
            style={{ width: '100%', height: iframeHeight, border: 0, display: 'block' }}
          />

          <div className="border-t border-slate-100 px-5 py-3 sm:px-8">
            <a
              href={`/api/public/budgets/${token}/pdf`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar en PDF
            </a>
          </div>
        </div>

        {/* Pasarela de pago — solo si hay algo que mostrar */}
        {(data.payment.paid > 0 || data.canPay) && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Estado del pago</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  data.payment.state === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : data.payment.state === 'partial'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {PAYMENT_STATE_LABEL[data.payment.state]}
              </span>
            </div>

            {data.payment.paid > 0 && (
              <p className="mb-3 text-sm text-slate-500">
                Pagado: {formatCurrency(data.payment.paid, data.currency)} · Resta: {formatCurrency(data.payment.remaining, data.currency)}
              </p>
            )}

            {polling && (
              <p className="mb-3 text-xs text-slate-400">
                El pago se está confirmando, puede demorar unos minutos — no hace falta que vuelvas a pagar.
              </p>
            )}

            {pagoParam === 'fallo' && (
              <p className="mb-3 text-xs text-red-500">
                El pago no se completó. Podés intentarlo de nuevo cuando quieras.
              </p>
            )}

            {data.canPay && data.payment.state !== 'paid' && (
              <div className="space-y-2">
                {data.payment.paid > 0 || data.payment.depositAmount == null ? (
                  // Ya pagó una parte (solo puede pagar el saldo), o no hay
                  // seña configurada (solo existe la opción de pagar todo).
                  <button
                    type="button"
                    onClick={() => handlePay('total')}
                    disabled={paying}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                    style={{ backgroundColor: '#0038ff' }}
                  >
                    {paying
                      ? 'Generando link de pago...'
                      : `Pagar ${data.payment.paid > 0 ? 'saldo' : 'total'} (${formatCurrency(data.payment.remaining, data.currency)}) con Mercado Pago`}
                  </button>
                ) : (
                  // Todavía no pagó nada y hay seña configurada — dos
                  // opciones claras, nada de montos libres (para evitar que
                  // paguen $1 y esperen que ya arranque el trabajo).
                  <>
                    <button
                      type="button"
                      onClick={() => handlePay('deposit')}
                      disabled={paying}
                      className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                      style={{ backgroundColor: '#0038ff' }}
                    >
                      {paying ? 'Generando link de pago...' : `Pagar seña (${formatCurrency(data.payment.depositAmount, data.currency)})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePay('total')}
                      disabled={paying}
                      className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Pagar total ({formatCurrency(data.payment.remaining, data.currency)})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA de .budgets — solo si el negocio no desactivó el branding (whiteLabel) */}
        {data.showFooterBranding && (
          <a
            href="https://budgets.webistudio.net"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            ¿Te gustaría un sistema de presupuestos y cobros como este para tu negocio? Conocé <span className="font-semibold">.budgets</span> →
          </a>
        )}
      </div>
    </div>
  )
}
