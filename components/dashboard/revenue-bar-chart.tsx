'use client'

import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { formatCurrency } from '@/lib/format'

type MonthlyRevenue = { month: string; total: number }

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatMonthLabel(key: string) {
  const [, month] = key.split('-')
  return MONTH_LABELS[Number(month) - 1] ?? key
}

interface RevenueBarChartProps {
  revenue: MonthlyRevenue[]
  currency: string
  accentColor?: string | null
}

export function RevenueBarChart({ revenue, currency, accentColor }: RevenueBarChartProps) {
  const color = accentColor || '#0f172a'

  const data = useMemo(
    () =>
      [...revenue]
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6) // últimos 6 meses con datos
        .map((r) => ({ ...r, label: formatMonthLabel(r.month) })),
    [revenue]
  )

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Todavía no hay presupuestos aprobados para graficar ingresos.
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            formatter={(value: number) => [formatCurrency(value, currency), 'Aprobado']}
            labelFormatter={() => ''}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e4e4e7' }}
          />
          <Bar dataKey="total" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}