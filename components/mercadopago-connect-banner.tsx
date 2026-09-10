'use client'
//components\mercadopago-connect-banner.tsx
//
// Cartel llamativo para que admin/owner conecten Mercado Pago si todavía
// no lo hicieron — hoy esa opción está escondida en Configuración > Plan
// y casi nadie la encuentra sola. Se puede cerrar (vuelve a aparecer en
// la próxima sesión, no para siempre, para no ser molesto).

import { useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { Wallet, X } from 'lucide-react'

const DISMISS_KEY = 'webibudgets_mp_banner_dismissed'
const MANAGER_ROLES = ['owner', 'admin']

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MercadoPagoConnectBanner() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const canConnect = MANAGER_ROLES.includes(role)

  const { data: tenant } = useSWR(canConnect ? '/api/tenants' : null, fetcher)

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (!canConnect || !tenant || tenant.mpConnected || dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  return (
    <div className="border-b border-[#0a2fae]/20 bg-gradient-to-r from-[#00b1ea] to-[#0038ff] px-4 py-3 text-sm text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold">Empezá a cobrar online</span>{' '}
            <span className="text-white/90">— conectá tu cuenta de Mercado Pago y generá links de cobro directo desde tus presupuestos.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/mercadopago/connect"
            className="whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0038ff] transition hover:bg-white/90"
          >
            Conectar ahora
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar"
            className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
