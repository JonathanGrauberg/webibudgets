'use client'
// components/dashboard/fx-quote-chip.tsx
//
// Cotización de referencia del dólar — informativa nomás, para decidir a
// ojo (ej. al aceptar un presupuesto en USD). No convierte ni recalcula
// nada del sistema.
import useSWR from 'swr'
import { DollarSign } from 'lucide-react'

interface DolarRate {
  nombre: string
  compra: number
  venta: number
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('failed')
  return res.json()
}

function formatArs(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
}

export function FxQuoteChip() {
  const { data, error } = useSWR<{ oficial?: DolarRate; blue?: DolarRate }>('/api/fx-quote', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60 * 1000,
  })

  if (error || (!data?.oficial && !data?.blue)) return null

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground" title="Cotización de referencia — no convierte nada automáticamente">
      <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      {data.oficial && (
        <span>Oficial <b className="text-foreground">{formatArs(data.oficial.venta)}</b></span>
      )}
      {data.blue && (
        <span>Blue <b className="text-foreground">{formatArs(data.blue.venta)}</b></span>
      )}
    </div>
  )
}
