'use client'
//app\(dashboard)\rendiciones\page.tsx
import { useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import RendicionesPage, { type RendicionData } from '@/components/rendiciones/RendicionesPage'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function firstDayOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

function exportToCsv(data: RendicionData) {
  const rows = [
    ['Cliente', 'Vendedor', 'N°', 'Fecha', 'Total', 'Costo', 'Ganancia', 'Margen'],
    ...data.budgets.map((b) => [
      b.clienteName, b.vendedorName, String(b.budgetNumber), b.fecha,
      String(b.total), String(b.costo), String(b.ganancia), `${b.margen.toFixed(1)}%`,
    ]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rendicion_${data.periodStart.slice(0, 10)}_${data.periodEnd.slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RendicionesRoute() {
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [periodStart, setPeriodStart] = useState(firstDayOfMonth())
  const [periodEnd, setPeriodEnd] = useState(today())
  const [isGenerating, setIsGenerating] = useState(false)

  const { data, isLoading } = useSWR<RendicionData>(
    currentId ? `/api/rendiciones/${currentId}` : null,
    fetcher
  )

  const generate = useCallback(async (from: string, to: string) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/rendiciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: from, periodEnd: to }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const created = await res.json()
      setCurrentId(created.id)
    } catch (err) {
      console.error(err)
      alert('No se pudo generar la rendición')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleUpdatePercentage = useCallback(async (shareId: string, percentage: number) => {
    if (!currentId) return
    await fetch(`/api/rendiciones/${currentId}/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage }),
    })
    mutate(`/api/rendiciones/${currentId}`)
  }, [currentId])

  const handleResetPercentage = useCallback(async (shareId: string) => {
    if (!currentId) return
    await fetch(`/api/rendiciones/${currentId}/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
    mutate(`/api/rendiciones/${currentId}`)
  }, [currentId])

  // Sin rendición generada todavía: selector de período
  if (!currentId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Rendiciones</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Elegí un período para calcular presupuestos completados, costos, ganancias y el reparto entre vendedores.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          />
          <span className="text-muted-foreground">a</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          />
        </div>
        <Button onClick={() => generate(periodStart, periodEnd)} disabled={isGenerating}>
          {isGenerating ? 'Generando...' : 'Generar rendición'}
        </Button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <RendicionesPage
        data={data}
        onDateRangeChange={() => setCurrentId(null)} // vuelve al selector de período
        onUpdatePercentage={handleUpdatePercentage}
        onResetPercentage={handleResetPercentage}
        onExport={() => exportToCsv(data)}
      />
    </div>
  )
}