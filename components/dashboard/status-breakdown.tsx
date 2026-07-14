'use client'

import { useMemo } from 'react'
import { STATUS_LABELS } from '@/lib/types'

type BudgetStatusCount = { status: string; count: number }

// 🌟 Paleta propia para los charts — distinta de STATUS_COLORS (que son clases
// Tailwind para badges), acá necesitamos hex reales para SVG/recharts.
const STATUS_CHART_COLORS: Record<string, string> = {
  draft: '#a1a1aa',
  sent: '#3b82f6',
  approved: '#10b981',
  completed: '#0ea5e9',
  rejected: '#f43f5e',
  expired: '#f59e0b',
}

const STATUS_ORDER = ['draft', 'sent', 'approved', 'completed', 'rejected', 'expired']

interface StatusBreakdownProps {
  statusStats: BudgetStatusCount[]
}

export function StatusBreakdown({ statusStats }: StatusBreakdownProps) {
  const { segments, total } = useMemo(() => {
    const total = statusStats.reduce((sum, s) => sum + s.count, 0)
    const segments = STATUS_ORDER.map((status) => {
      const found = statusStats.find((s) => s.status === status)
      return found && found.count > 0
        ? { status, count: found.count, pct: total > 0 ? (found.count / total) * 100 : 0 }
        : null
    }).filter((s): s is { status: string; count: number; pct: number } => s !== null)

    return { segments, total }
  }, [statusStats])

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Todavía no hay presupuestos para mostrar el desglose.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <div
            key={s.status}
            style={{ width: `${s.pct}%`, backgroundColor: STATUS_CHART_COLORS[s.status] }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            title={`${STATUS_LABELS[s.status as keyof typeof STATUS_LABELS]}: ${s.count}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {segments.map((s) => (
          <div key={s.status} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_CHART_COLORS[s.status] }}
            />
            <span className="text-muted-foreground">
              {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS]}
            </span>
            <span className="ml-auto font-medium tabular-nums text-card-foreground">
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}