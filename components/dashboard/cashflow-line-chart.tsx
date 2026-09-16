'use client'

import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/format'

type DailyCashflow = { date: string; cobrado: number; recibos: number; gastado: number }

const SERIES_LABELS: Record<string, string> = {
  cobrado: 'Cobrado (Cobros)',
  recibos: 'Cobrado (Documentos)',
  gastado: 'Gastado',
}

function formatDayLabel(key: string) {
  // 'YYYY-MM-DD' -> 'DD/MM', sin pasar por Date (evita corrimientos de huso horario)
  const [, month, day] = key.split('-')
  return `${day}/${month}`
}

interface CashflowLineChartProps {
  data: DailyCashflow[]
  currency: string
}

export function CashflowLineChart({ data, currency }: CashflowLineChartProps) {
  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({ ...d, label: formatDayLabel(d.date) })),
    [data]
  )

  const hasAnyMovement = chartData.some((d) => d.cobrado > 0 || d.recibos > 0 || d.gastado > 0)

  if (!hasAnyMovement) {
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
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            interval={3}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickFormatter={(v) => formatCurrency(v, currency).replace(/\D00$/, '')}
            width={70}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value, currency), SERIES_LABELS[name] ?? name]}
            contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e4e4e7' }}
          />
          <Legend
            formatter={(value) => SERIES_LABELS[value] ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="cobrado" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="recibos" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="gastado" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
