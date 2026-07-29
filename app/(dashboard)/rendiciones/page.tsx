'use client'
// app/(dashboard)/rendiciones/page.tsx

import { useState, useCallback } from 'react'
import useSWR from 'swr'

import RendicionesPage, {
  type RendicionData,
} from '@/components/rendiciones/RendicionesPage'

import { Button } from '@/components/ui/button'
import { Loader2, Crown } from 'lucide-react'

import { hasFeature } from '@/lib/features'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function firstDayOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function exportToCsv(data: RendicionData) {
  const rows = [
    ['Cliente', 'Vendedor', 'N°', 'Fecha', 'Total', 'Costo', 'Ganancia', 'Margen'],
    ...data.budgets.map((b) => [
      b.clienteName,
      b.vendedorName,
      String(b.budgetNumber),
      b.fecha,
      String(b.total),
      String(b.costo),
      String(b.ganancia),
      `${b.margen.toFixed(1)}%`,
    ]),
  ]

  const csv = rows
    .map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `rendicion_${data.periodStart}_${data.periodEnd}.csv`
  a.click()

  URL.revokeObjectURL(url)
}

const EMPTY_USERS_ARRAY: any[] = []

export default function RendicionesRoute() {
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [periodStart, setPeriodStart] = useState(firstDayOfMonth())
  const [periodEnd, setPeriodEnd] = useState(today())
  const [isGenerating, setIsGenerating] = useState(false)

  /*
   * EXACTAMENTE igual que Products:
   * obtenemos el tenant completo desde el backend.
   */
  const { data: tenant } = useSWR('/api/tenants', fetcher, {
    revalidateOnFocus: false,
  })

  /*
   * Una única fuente de verdad.
   */
  const hasCommissions = hasFeature(tenant, 'commissions')
  const hasExportData = hasFeature(tenant, 'exportData')
  const hasAuditHistory = hasFeature(tenant, 'auditHistory')

  const { data, isLoading, mutate } = useSWR<RendicionData>(
    currentId ? `/api/rendiciones/${currentId}` : null,
    fetcher
  )

  const generate = useCallback(async (from: string, to: string) => {
    setIsGenerating(true)

    try {
      const res = await fetch('/api/rendiciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodStart: from,
          periodEnd: to,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate')
      }

      const created = await res.json()

      setCurrentId(created.id)
    } catch (err) {
      console.error(err)
      alert('No se pudo generar la rendición')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (currentId) mutate()
  }, [currentId, mutate])

  if (!currentId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Rendiciones</h1>

        <p className="max-w-sm text-sm text-muted-foreground">
          Elegí un período para calcular presupuestos completados, costos,
          ganancias y el reparto entre vendedores.
        </p>

        <div className="flex flex-col items-center gap-2">
          <div className="relative flex items-center gap-2 rounded-lg border border-input bg-background p-2 shadow-sm">
            <input
              type="date"
              value={periodStart}
              disabled={!hasCommissions}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="rounded-md border border-input px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />

            <span className="text-sm text-muted-foreground">a</span>

            <input
              type="date"
              value={periodEnd}
              disabled={!hasCommissions}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="rounded-md border border-input px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {!hasCommissions && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              Rango de fechas personalizado disponible en PRO.
            </p>
          )}
        </div>

        <Button
          onClick={() => generate(periodStart, periodEnd)}
          disabled={isGenerating}
        >
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
        tenantUsers={data.tenantUsers || EMPTY_USERS_ARRAY}
        onDateRangeChange={() => setCurrentId(null)}
        onUpdatePercentage={handleRefresh}
        onResetPercentage={handleRefresh}
        onExport={() => exportToCsv(data)}
        hasCommissions={hasCommissions}
        hasExportData={hasExportData}
        hasAuditHistory={hasAuditHistory}
      />
    </div>
  )
}