'use client'

import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { formatCurrency } from '@/lib/format'

type MonthlyRevenue = { month: string; total: number }

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatMonthLabel(key: string) {
  const [, month] = key.split('-')
  return MONTH_LABELS[Number(month) - 1] ?? key
}

interface RevenueTrendChartProps {
  revenue: MonthlyRevenue[]
  currency: string
  accentColor?: string | null
}

export function RevenueTrendChart({ revenue, currency, accentColor }: RevenueTrendChartProps) {
  const color = accentColor || '#0f172a'

  const data = useMemo(
    () =>
      [...revenue]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((r) => ({ ...r, label: formatMonthLabel(r.month) })),
    [revenue]
  )

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Todavía no hay presupuestos aprobados para graficar ingresos.
      </p>
    )
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, currency), 'Aprobado']}
            labelFormatter={() => ''}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="total" stroke={color} strokeWidth={2} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}