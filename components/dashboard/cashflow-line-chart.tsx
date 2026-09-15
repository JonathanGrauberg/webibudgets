'use client'

import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/format'

type MonthlyCashflow = { month: string; cobrado: number; gastado: number }

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatMonthLabel(key: string) {
  const [, month] = key.split('-')
  return MONTH_LABELS[Number(month) - 1] ?? key
}

interface CashflowLineChartProps {
  data: MonthlyCashflow[]
  currency: string
}

export function CashflowLineChart({ data, currency }: CashflowLineChartProps) {
  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6) // últimos 6 meses con datos
        .map((d) => ({ ...d, label: formatMonthLabel(d.month) })),
    [data]
  )

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        Todavía no hay cobros o gastos cargados para graficar.
      </div>
    )
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickFormatter={(v) => formatCurrency(v, currency).replace(/\D00$/, '')}
            width={70}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name === 'cobrado' ? 'Cobrado' : 'Gastado']}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e4e4e7' }}
          />
          <Legend
            formatter={(value) => (value === 'cobrado' ? 'Cobrado' : 'Gastado')}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="cobrado" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="gastado" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
