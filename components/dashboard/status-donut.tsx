'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { STATUS_LABELS } from '@/lib/types'

type BudgetStatusCount = { status: string; count: number }

const STATUS_ORDER = ['approved', 'sent', 'draft', 'completed', 'rejected', 'expired']

const NEUTRAL_TONES: Record<string, string> = {
  sent: '#94a3b8',
  draft: '#cbd5e1',
  completed: '#475569',
  rejected: '#fca5a5',
  expired: '#fcd34d',
}

interface StatusDonutProps {
  statusStats: BudgetStatusCount[]
  accentColor?: string | null
}

export function StatusDonut({ statusStats, accentColor }: StatusDonutProps) {
  const accent = accentColor || '#0f172a'

  const { segments, total, approvedPct } = useMemo(() => {
    const total = statusStats.reduce((sum, s) => sum + s.count, 0)
    const segments = STATUS_ORDER.map((status) => {
      const found = statusStats.find((s) => s.status === status)
      if (!found || found.count === 0) return null
      return {
        status,
        count: found.count,
        fill: status === 'approved' ? accent : NEUTRAL_TONES[status] ?? '#e2e8f0',
      }
    }).filter((s): s is { status: string; count: number; fill: string } => s !== null)

    const approved = statusStats.find((s) => s.status === 'approved')?.count ?? 0
    const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0

    return { segments, total, approvedPct }
  }, [statusStats, accent])

  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Todavía no hay presupuestos para mostrar el desglose.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="count"
              nameKey="status"
              innerRadius={62}
              outerRadius={84}
              paddingAngle={3}
              stroke="none"
            >
              {segments.map((s) => (
                <Cell key={s.status} fill={s.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-card-foreground">{approvedPct}%</span>
          <span className="text-[11px] text-muted-foreground">aprobados</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3 sm:w-auto">
        {segments.map((s) => (
          <div key={s.status} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.fill }} />
            <span className="text-muted-foreground">
              {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS]}
            </span>
            <span className="ml-auto font-medium tabular-nums text-card-foreground sm:ml-2">
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}