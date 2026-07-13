'use client'
// components/product-form.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import type { ProductService, ProductCategory } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies'
import { UNIT_OPTIONS, detectUnitType } from '@/lib/units'

// Valor especial para "ingresar manualmente"
const CUSTOM_UNIT_VALUE = '__custom__'

// Agrupamos las unidades por tipo para el Select
const UNIT_GROUPS: { label: string; units: typeof UNIT_OPTIONS }[] = [
  { label: 'Área',      units: UNIT_OPTIONS.filter((u) => u.type === 'area') },
  { label: 'Longitud',  units: UNIT_OPTIONS.filter((u) => u.type === 'length') },
  { label: 'Volumen',   units: UNIT_OPTIONS.filter((u) => u.type === 'volume') },
  { label: 'Peso',      units: UNIT_OPTIONS.filter((u) => u.type === 'weight') },
  { label: 'Tiempo',    units: UNIT_OPTIONS.filter((u) => u.type === 'time') },
  { label: 'Unidad',    units: UNIT_OPTIONS.filter((u) => u.type === 'unit') },
]

interface ProductFormProps {
  product?: ProductService | null
  defaultCurrency?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, defaultCurrency, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determinar si la unidad guardada está en la lista predefinida
  const savedUnit     = product?.unit ?? 'un.'
  const isKnownUnit   = UNIT_OPTIONS.some((u) => u.value === savedUnit)
  const initialSelect = isKnownUnit ? savedUnit : CUSTOM_UNIT_VALUE

  const [formData, setFormData] = useState({
    name:        product?.name        ?? '',
    description: product?.description ?? '',
    category:    (product?.category   ?? 'other') as ProductCategory,
    price:       product?.price?.toString() ?? '',
    cost:        product?.cost?.toString()  ?? '',
    currency:    product?.currency    ?? defaultCurrency ?? DEFAULT_CURRENCY,
    unit:        savedUnit,
    active:      product?.active      ?? true,
  })

  // Estado local del select de unidad (puede diferir de formData.unit cuando es custom)
  const [unitSelect, setUnitSelect]   = useState(initialSelect)
  const [customUnit, setCustomUnit]   = useState(isKnownUnit ? '' : savedUnit)

  const handleUnitSelectChange = (val: string) => {
    setUnitSelect(val)
    if (val !== CUSTOM_UNIT_VALUE) {
      setFormData((f) => ({ ...f, unit: val }))
    }
  }

  const handleCustomUnitChange = (val: string) => {
    setCustomUnit(val)
    setFormData((f) => ({ ...f, unit: val }))
  }

  const unitType = detectUnitType(formData.unit)

  const unitTypeLabels: Record<string, string> = {
    area:   '📐 Superficie — la calculadora usará ancho × alto',
    length: '📏 Longitud — la calculadora pedirá metros/cm',
    volume: '💧 Volumen — la calculadora pedirá litros o dimensiones',
    weight: '⚖️ Peso — la calculadora pedirá kg/g',
    time:   '⏱ Tiempo — la calculadora pedirá horas',
    unit:   '🔢 Unidad contable — sin calculadora de medidas',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url    = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to save product')
      onSuccess()
    } catch (err) {
      console.error('Error saving product:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nombre */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="name">Nombre *</Label>
            <Tooltip>
              <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent>Nombre del producto o servicio</TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Membrana impermeabilizante, Mano de obra instalación..."
            required
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción breve..."
            rows={2}
          />
        </div>

        {/* Categoría + Unidad */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(v: ProductCategory) => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="unit">Unidad de medida *</Label>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>
                  Define cómo se cotiza este producto.<br />
                  Unidades de área/longitud/volumen/peso habilitan<br />
                  la calculadora automática al armar presupuestos.
                </TooltipContent>
              </Tooltip>
            </div>

            <Select value={unitSelect} onValueChange={handleUnitSelectChange}>
              <SelectTrigger id="unit"><SelectValue placeholder="Seleccionar unidad..." /></SelectTrigger>
              <SelectContent>
                {UNIT_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {group.label}
                    </SelectLabel>
                    {group.units.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        <span className="font-medium">{u.symbol}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{u.label}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectGroup>
                  <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Otra</SelectLabel>
                  <SelectItem value={CUSTOM_UNIT_VALUE}>Escribir manualmente...</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Input libre cuando eligen "personalizado" */}
            {unitSelect === CUSTOM_UNIT_VALUE && (
              <Input
                placeholder="Ej: paleta, rollo, bandeja..."
                value={customUnit}
                onChange={(e) => handleCustomUnitChange(e.target.value)}
                className="mt-1.5"
              />
            )}

            {/* Badge informativo del tipo detectado */}
            {formData.unit && (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {unitTypeLabels[unitType]}
              </p>
            )}
          </div>
        </div>

        {/* Precio + Moneda */}
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="price">Precio por {formData.unit || 'unidad'} *</Label>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>
                  Precio unitario. Si es m², ingresá el precio por m².
                  La calculadora multiplicará por la cantidad real.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="price"
              type="number"
              min="0"
              step="any"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ej: 8500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda *</Label>
            <Select
              value={formData.currency}
              onValueChange={(v) => setFormData({ ...formData, currency: v })}
            >
              <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Costo + Margen */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="cost">Costo por {formData.unit || 'unidad'}</Label>
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Opcional. Mismo criterio que el precio.</TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="cost"
              type="number"
              min="0"
              step="any"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label>Margen bruto</Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
              {(() => {
                const p = Number(formData.price)
                const c = Number(formData.cost)
                if (!formData.cost || !p || p <= 0) return '—'
                const pct = ((p - c) / p) * 100
                return (
                  <span className={pct < 20 ? 'text-red-600 font-semibold' : pct < 40 ? 'text-amber-600' : 'text-emerald-600 font-semibold'}>
                    {pct.toFixed(0)}%
                  </span>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Activo */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="active">Producto activo</Label>
            <p className="text-sm text-muted-foreground">
              Los productos inactivos no aparecen al crear presupuestos
            </p>
          </div>
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}