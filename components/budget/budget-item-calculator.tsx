// components/budget/budget-item-calculator.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ruler } from 'lucide-react'

interface BudgetItemCalculatorProps {
  widthCm: number | null
  heightCm: number | null
  hours: number | null
  onChange: (field: 'widthCm' | 'heightCm' | 'hours', value: number | null) => void
}

/** Mismo cálculo que el backend (lib/budget-calculator.ts), acá es solo para feedback visual inmediato */
function computeM2(widthCm: number | null, heightCm: number | null): number | null {
  if (!widthCm || !heightCm) return null
  const m2 = (widthCm * heightCm) / 10000
  return Math.round(m2 * 100) / 100
}

export function BudgetItemCalculator({ widthCm, heightCm, hours, onChange }: BudgetItemCalculatorProps) {
  const m2 = computeM2(widthCm, heightCm)

  const handleNumberChange = (field: 'widthCm' | 'heightCm' | 'hours') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    onChange(field, raw === '' ? null : Number(raw))
  }

  return (
    <div className="mt-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-2">
      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
        <Ruler className="h-3 w-3" /> Medidas
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] font-normal text-muted-foreground">Ancho (cm)</Label>
          <Input
            type="number"
            min={0}
            value={widthCm ?? ''}
            onChange={handleNumberChange('widthCm')}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-normal text-muted-foreground">Alto (cm)</Label>
          <Input
            type="number"
            min={0}
            value={heightCm ?? ''}
            onChange={handleNumberChange('heightCm')}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-normal text-muted-foreground">Horas</Label>
          <Input
            type="number"
            min={0}
            value={hours ?? ''}
            onChange={handleNumberChange('hours')}
            className="h-8 text-xs"
          />
        </div>
      </div>
      {m2 !== null && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Superficie: <span className="font-medium text-foreground">{m2} m²</span>
        </p>
      )}
    </div>
  )
}