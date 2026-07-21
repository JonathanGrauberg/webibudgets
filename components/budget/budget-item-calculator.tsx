'use client'

// components/budget/budget-item-calculator.tsx
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ruler, Weight, Droplets, Clock, Maximize2 } from 'lucide-react'
import {
  detectUnitType,
  getUnitDef,
  computeQuantity,
  decimalHoursToTimeInput,
  timeInputToDecimalHours,
  computeRangeHours,
  type CalculatorInputs,
  type UnitType,
} from '@/lib/units'
import { formatCurrency, formatHoursAsClock  } from '@/lib/format'

interface BudgetItemCalculatorProps {
  unit: string | null | undefined
  unitPrice: number
  currency: string
  widthCm: number | null
  heightCm: number | null
  depthCm: number | null
  direct: number | null
  hours: number | null
  onChange: (
    field: 'widthCm' | 'heightCm' | 'depthCm' | 'direct' | 'hours',
    value: number | null
  ) => void
  onQuantityChange: (quantity: number) => void
}

const TYPE_ICONS: Record<UnitType, React.ElementType> = {
  area:   Maximize2,
  length: Ruler,
  volume: Droplets,
  weight: Weight,
  time:   Clock,
  unit:   Ruler,
}

const TYPE_LABELS: Record<UnitType, string> = {
  area:   'Superficie',
  length: 'Longitud',
  volume: 'Volumen',
  weight: 'Peso',
  time:   'Tiempo',
  unit:   'Cantidad',
}

function NumInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: number | null
  placeholder?: string
  onChange: (v: number | null) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-normal text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        step="any"
        value={value ?? ''}
        placeholder={placeholder ?? '0'}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="h-8 text-xs"
      />
    </div>
  )
}

export function BudgetItemCalculator({
  unit,
  unitPrice,
  currency,
  widthCm,
  heightCm,
  depthCm,
  direct,
  hours,
  onChange,
  onQuantityChange,
}: BudgetItemCalculatorProps) {
  const unitType = detectUnitType(unit)
  const [showRange, setShowRange] = useState(false)
  const [fromTime, setFromTime] = useState('')
  const [toTime, setToTime] = useState('')
  const unitDef  = getUnitDef(unit)
  const Icon     = TYPE_ICONS[unitType]

  const inputs: CalculatorInputs = {
    a:      widthCm,
    b:      heightCm,
    c:      depthCm,
    direct: unitType === 'time' ? hours : direct,
  }

  const result = computeQuantity(unit, inputs)

  // ✅ useEffect + useRef: propaga la cantidad SOLO cuando cambia,
  // nunca durante el render — elimina el loop infinito
  const prevQty = useRef<number | null>(null)
  useEffect(() => {
    if (!result.isComplete) return
    if (prevQty.current === result.quantity) return
    prevQty.current = result.quantity
    onQuantityChange(result.quantity)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.isComplete, result.quantity])
  // onQuantityChange se omite intencionalmente: viene estabilizado
  // con useCallback desde el padre (BudgetItemRow)

  const subtotalEstimado = result.isComplete ? result.quantity * unitPrice : null

  if (unitType === 'unit') return null

  return (
    <div className="mt-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {TYPE_LABELS[unitType]} · {unitDef.symbol}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${getColCount(unitType)}, 1fr)` }}>
        {unitType === 'area' && (
          <>
            <NumInput label="Ancho (cm)" value={widthCm} placeholder="ej: 240" onChange={(v) => onChange('widthCm', v)} />
            <NumInput label="Alto (cm)"  value={heightCm} placeholder="ej: 150" onChange={(v) => onChange('heightCm', v)} />
          </>
        )}

        {unitType === 'length' && (
          <NumInput
            label={`Longitud (${getInputLabel(unit)})`}
            value={direct}
            placeholder="ej: 3.5"
            onChange={(v) => onChange('direct', v)}
          />
        )}

        {unitType === 'volume' && (unit ?? '').toLowerCase().includes('m') && !/(l\b|litro|ml)/.test((unit ?? '').toLowerCase()) ? (
          <>
            <NumInput label="Ancho (cm)"       value={widthCm}  onChange={(v) => onChange('widthCm', v)} />
            <NumInput label="Alto (cm)"        value={heightCm} onChange={(v) => onChange('heightCm', v)} />
            <NumInput label="Profundidad (cm)" value={depthCm}  onChange={(v) => onChange('depthCm', v)} />
          </>
        ) : unitType === 'volume' ? (
          <NumInput
            label={`Cantidad (${unitDef.symbol})`}
            value={direct}
            placeholder="ej: 5"
            onChange={(v) => onChange('direct', v)}
          />
        ) : null}

        {unitType === 'weight' && (
          <NumInput
            label={`Peso (${unitDef.symbol})`}
            value={direct}
            placeholder="ej: 12.5"
            onChange={(v) => onChange('direct', v)}
          />
        )}

        {unitType === 'time' && (
        <div className="col-span-full space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-normal text-muted-foreground">Duración</Label>
            <Input
              type="time"
              step={60}
              value={decimalHoursToTimeInput(hours)}
              disabled={showRange}
              onChange={(e) => onChange('hours', timeInputToDecimalHours(e.target.value))}
              className="h-8 text-xs w-32"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowRange((v) => !v)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            <Clock className="h-3 w-3" />
            {showRange ? 'Ocultar franja horaria' : 'Especificar franja horaria'}
          </button>

          {showRange && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-normal text-muted-foreground">Desde</Label>
                <Input
                  type="time"
                  value={fromTime}
                  onChange={(e) => {
                    setFromTime(e.target.value)
                    const h = computeRangeHours(e.target.value, toTime)
                    if (h !== null) onChange('hours', h)
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-normal text-muted-foreground">Hasta</Label>
                <Input
                  type="time"
                  value={toTime}
                  onChange={(e) => {
                    setToTime(e.target.value)
                    const h = computeRangeHours(fromTime, e.target.value)
                    if (h !== null) onChange('hours', h)
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {result.isComplete && (
        <div className="rounded-md bg-foreground/5 px-3 py-2 text-xs space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cantidad calculada</span>
            <span className="font-semibold text-foreground">
              {unitType === 'time'
                ? formatHoursAsClock(result.quantity)
                : result.label || `${result.quantity} ${unitDef.symbol}`}
            </span>
          </div>
          {subtotalEstimado !== null && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal estimado</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotalEstimado, currency)}</span>
            </div>
          )}
        </div>
      )}

      {!result.isComplete && (
        <p className="text-[10px] text-muted-foreground">
          Completá las medidas para calcular la cantidad exacta automáticamente.
        </p>
      )}
    </div>
  )
}

function getColCount(type: UnitType): number {
  if (type === 'area') return 2
  if (type === 'volume') return 3
  return 1
}

function getInputLabel(unit: string | null | undefined): string {
  const u = (unit ?? '').toLowerCase()
  if (/mm|milímetro/.test(u)) return 'mm'
  if (/cm|centímetro/.test(u)) return 'cm'
  return 'm'
}