'use client'

import React, { useState } from 'react'
import { Wallet, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { getContrastColor } from '@/lib/contrast'

interface ColorSystem {
  primary: string
  accent: string
}

interface MercadoPagoConnectCardProps {
  connected: boolean
  colors: ColorSystem
  onDisconnected?: () => void
}

export default function MercadoPagoConnectCard({ connected, colors, onDisconnected }: MercadoPagoConnectCardProps) {
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    if (!confirm('¿Desconectar tu cuenta de Mercado Pago? Vas a dejar de poder cobrar directo desde la app hasta que la vuelvas a conectar.')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/mercadopago/connect/disconnect', { method: 'POST' })
      if (res.ok) onDisconnected?.()
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 relative">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)` }}
      />
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)` }}
            >
              <Wallet className="w-5 h-5" style={{ color: getContrastColor(colors.primary) }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Cobros online</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Mercado Pago</p>
            </div>
          </div>
          {connected && (
            <span
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Conectada
            </span>
          )}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {connected
            ? 'Tu cuenta de Mercado Pago está vinculada. El dinero de los cobros generados desde la app llega directo a tu cuenta.'
            : 'Vinculá tu cuenta de Mercado Pago para poder generar links de cobro desde tus presupuestos. El dinero llega directo a tu cuenta, no pasa por Webi Studio.'}
        </p>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Importante:</strong> por defecto Mercado Pago demora hasta 35 días en liberarte la plata de un cobro ("a liquidar"). Revisá en tu cuenta de MP → Más → Costos y Cuotas → Link de pago → Por cobro, para elegir "Al instante" u otro plazo más corto (cada opción tiene su propio costo).
          </p>
        </div>

        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full py-2.5 rounded-lg font-medium text-center transition-all text-sm border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {disconnecting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Desconectar cuenta'}
          </button>
        ) : (
          <a
            href="/api/mercadopago/connect"
            className="block w-full py-2.5 rounded-lg font-medium text-center transition-all text-sm"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
              color: getContrastColor(colors.primary),
            }}
          >
            Conectar con Mercado Pago
          </a>
        )}
      </div>
    </div>
  )
}
