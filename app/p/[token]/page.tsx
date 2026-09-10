'use client'
//app\p\[token]\page.tsx
//
// Portal público del presupuesto — lo abre el cliente final desde el link
// que le mandaron, sin login. Es una versión web fiel del presupuesto (con
// la marca del negocio, no la nuestra) más, si el negocio conectó Mercado
// Pago, la pasarela para pagar la seña o el saldo.

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import { PAYMENT_STATE_LABEL, type PaymentState } from '@/lib/budget-payments'

type PublicBudgetData = {
  budgetNumber: number | null
  status: string
  currency: string
  subtotal: number
  discount: number
  tax: number
  shippingCost: number | null
  total: number
  paymentTerms: string | null
  validUntil: string | null
  createdAt: string
  client: { name: string; company: string | null } | null
  items: { name: string; quantity: number; unitPrice: number; subtotal: number | null }[]
  tenant: {
    name: string
    logoUrl: string | null
    primaryColor: string | null
    accentColor: string | null
    phone: string | null
    email: string | null
    website: string | null
  }
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

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function PublicBudgetPortalPage() {
  const params = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const pagoParam = searchParams.get('pago') // 'exito' | 'pendiente' | 'fallo'

  const [data, setData] = useState<PublicBudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const [polling, setPolling] = useState(pagoParam === 'exito' || pagoParam === 'pendiente')
  const pollCount = useRef(0)

  async function loadBudget() {
    try {
      const res = await fetch(`/api/public/budgets/${params.token}`)
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
  }, [params.token])

  // 👇 Polling tras volver de Mercado Pago — el webhook puede tardar unos
  // segundos en impactar el pago, así que refrescamos solos en vez de
  // dejar al cliente mirando un estado desactualizado.
  useEffect(() => {
    if (!polling) return

    const interval = setInterval(async () => {
      pollCount.current += 1
      const res = await fetch(`/api/public/budgets/${params.token}/status`).catch(() => null)
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
  }, [polling, params.token])

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetch(`/api/public/budgets/${params.token}/pay`, { method: 'POST' })
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

  const primary = data.tenant.primaryColor || '#0f172a'
  const budgetNumber = String(data.budgetNumber ?? 0).padStart(6, '0')

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Documento */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Encabezado con marca del negocio */}
          <div className="border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {data.tenant.logoUrl ? (
                  <img src={data.tenant.logoUrl} alt={data.tenant.name} className="h-12 w-12 rounded-xl object-contain" />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {data.tenant.name?.[0]?.toUpperCase() ?? '.'}
                  </div>
                )}
                <div>
                  <p className="text-base font-bold text-slate-900">{data.tenant.name}</p>
                  <p className="text-xs text-slate-500">
                    {[data.tenant.phone, data.tenant.email, data.tenant.website].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: primary }}>
                  Presupuesto #{budgetNumber}
                </p>
                <p className="text-xs text-slate-400">{formatDate(data.createdAt)}</p>
                {data.validUntil && (
                  <p className="text-xs text-slate-400">Válido hasta {formatDate(data.validUntil)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="border-b border-slate-100 px-5 py-4 sm:px-8">
            <p className="text-xs uppercase tracking-wide text-slate-400">Para</p>
            <p className="text-sm font-semibold text-slate-900">
              {data.client?.company || data.client?.name || 'Cliente'}
            </p>
          </div>

          {/* Ítems */}
          <div className="divide-y divide-slate-100 px-5 sm:px-8">
            {data.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">
                    {item.quantity} × {formatCurrency(item.unitPrice, data.currency)}
                  </p>
                </div>
                <p className="shrink-0 font-medium text-slate-700">
                  {formatCurrency(item.subtotal ?? item.unitPrice * item.quantity, data.currency)}
                </p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="space-y-1.5 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm sm:px-8">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(data.subtotal, data.currency)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Descuento</span>
                <span>− {formatCurrency(data.discount, data.currency)}</span>
              </div>
            )}
            {data.tax > 0 && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Impuestos</span>
                <span>{formatCurrency(data.tax, data.currency)}</span>
              </div>
            )}
            {!!data.shippingCost && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Envío</span>
                <span>{formatCurrency(data.shippingCost, data.currency)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold" style={{ color: primary }}>
                {formatCurrency(data.total, data.currency)}
              </span>
            </div>
          </div>

          {data.paymentTerms && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-8">
              {data.paymentTerms}
            </div>
          )}
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
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: '#0038ff' }}
              >
                {paying
                  ? 'Generando link de pago...'
                  : `Pagar ${data.payment.paid > 0 ? 'saldo' : data.depositEnabled ? 'seña' : 'total'} (${formatCurrency(
                      data.payment.suggestedAmount,
                      data.currency
                    )}) con Mercado Pago`}
              </button>
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
