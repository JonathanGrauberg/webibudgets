'use client'

import { useMemo } from 'react'

type TopClient = {
  clientId: string
  name: string
  company: string | null
  totalRevenue: number
  budgetCount: number
}

interface TopClientsProps {
  clients: TopClient[]
  accentColor?: string | null
  currency?: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// 👇 un color distinto por fila en vez de un único accent (que sin marca
// configurada caía en un gris casi negro y quedaba todo el ranking parejo/pálido).
const BAR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4']

export function TopClients({ clients, currency = 'ARS' }: TopClientsProps) {
  const maxRevenue = useMemo(
    () => Math.max(1, ...clients.map((c) => c.totalRevenue)),
    [clients]
  )

  if (clients.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Todavía no hay presupuestos aprobados o completados para armar el ranking.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {clients.map((c, idx) => (
        <div key={c.clientId} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {String(idx + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-card-foreground">
                {c.company || c.name}
              </p>
              <span className="shrink-0 text-xs font-medium text-card-foreground">
                {formatCurrency(c.totalRevenue, currency)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(c.totalRevenue / maxRevenue) * 100}%`,
                  backgroundColor: BAR_PALETTE[idx % BAR_PALETTE.length],
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {c.company ? `${c.name} · ` : ''}{c.budgetCount} presupuesto{c.budgetCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
