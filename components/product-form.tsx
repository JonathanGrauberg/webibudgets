'use client'
// components/product-form.tsx
import { Crown } from 'lucide-react'
import { hasFeature } from '@/lib/features'
import { UpgradeModal } from '@/components/feature-gate'
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
import { HelpCircle, Plus, Trash2 } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import type { ProductService, ProductCategory, ProductVariant } from '@/lib/types'
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
  const [upgradeOpen, setUpgradeOpen] = useState(false) // 👈 nuevo

  // 👇 nuevo — reusa el cache de SWR, no pega una request extra si ya se pidió en la page
  const { data: tenantBranding } = useSWR('/api/tenants', (url: string) => fetch(url).then((r) => r.json()))
  const hasVariantsFeature = hasFeature(
    { plan: tenantBranding?.plan, features: tenantBranding?.features },
    'productVariants'
  )
  const hasCustomCategoriesFeature = hasFeature(
    { plan: tenantBranding?.plan, features: tenantBranding?.features },
    'customCategories'
  )
 const [categoryUpgradeOpen, setCategoryUpgradeOpen] = useState(false)

  // Determinar si la unidad guardada está en la lista predefinida
  const savedUnit     = product?.unit ?? 'un.'
  const isKnownUnit   = UNIT_OPTIONS.some((u) => u.value === savedUnit)
  const initialSelect = isKnownUnit ? savedUnit : CUSTOM_UNIT_VALUE

  const [formData, setFormData] = useState({
    name:        product?.name        ?? '',
    description: product?.description ?? '',
    price:       product?.price?.toString() ?? '',
    cost:        product?.cost?.toString()  ?? '',
    currency:    product?.currency    ?? defaultCurrency ?? DEFAULT_CURRENCY,
    unit:        savedUnit,
    active:      product?.active      ?? true,
  })

  // Estado local del select de unidad (puede diferir de formData.unit cuando es custom)
  const [unitSelect, setUnitSelect]   = useState(initialSelect)
  const [customUnit, setCustomUnit]   = useState(isKnownUnit ? '' : savedUnit)

  const variantsUrl = product?.id ? `/api/products/${product.id}/variants` : null
  const { data: variants = [], isLoading: variantsLoading } = useSWR<ProductVariant[]>(
    variantsUrl,
    (url: string) => fetch(url).then((r) => r.json())
  )

  // value combinado para el Select: "legacy:other" | "custom:<uuid>"
const [categoryValue, setCategoryValue] = useState(
  product?.customCategoryId
    ? `custom:${product.customCategoryId}`
    : `legacy:${product?.category ?? 'other'}`
)

const { data: categories = [] } = useSWR<{ id: string; name: string }[]>(
  '/api/categories',
  (url: string) => fetch(url).then((r) => r.json())
)

const [creatingCategory, setCreatingCategory] = useState(false)
const [newCategoryName, setNewCategoryName] = useState('')
const [isSavingCategory, setIsSavingCategory] = useState(false)

const CREATE_CATEGORY_VALUE = '__create__'

const handleCategorySelectChange = (val: string) => {
    if (val === CREATE_CATEGORY_VALUE) {
     if (!hasCustomCategoriesFeature) {
       setCategoryUpgradeOpen(true)
       return
     }
      setCreatingCategory(true)
      return
    }
    setCategoryValue(val)
  }

const handleCreateCategory = async () => {
  if (!newCategoryName.trim()) return
  setIsSavingCategory(true)
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    })
    if (!res.ok) throw new Error('No se pudo crear la categoría')
    const cat = await res.json()

    // 👇 antes: mutate('/api/categories') — pedía refetch y no esperaba
    // ahora: inyectamos la categoría nueva directo en la caché, sin ir a la red
    await mutate(
      '/api/categories',
      (current: { id: string; name: string }[] = []) => [...current, cat],
      { revalidate: false }
    )

    setCategoryValue(`custom:${cat.id}`)
    setNewCategoryName('')
    setCreatingCategory(false)
  } catch (err) {
    console.error(err)
    alert('Error al crear la categoría')
  } finally {
    setIsSavingCategory(false)
  }
}

const [variantDrafts, setVariantDrafts] = useState<Record<string, { label: string; stock: string }>>({})
const [savingVariantId, setSavingVariantId] = useState<string | null>(null)
const [newVariantLabel, setNewVariantLabel] = useState('')
const [newVariantStock, setNewVariantStock] = useState('')
const [isAddingVariant, setIsAddingVariant] = useState(false)

const handleAddVariant = async () => {
  if (!product?.id || !newVariantLabel.trim()) return
  setIsAddingVariant(true)
  try {
    const res = await fetch(`/api/products/${product.id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newVariantLabel.trim(), stock: Number(newVariantStock) || 0 }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || 'No se pudo crear la variante')
    }
    setNewVariantLabel('')
    setNewVariantStock('')
    mutate(variantsUrl)
  } catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Error al crear la variante')
  } finally {
    setIsAddingVariant(false)
  }
}

const handleSaveVariant = async (variant: ProductVariant) => {
  if (!product?.id) return
  const draft = variantDrafts[variant.id]
  if (!draft) return
  setSavingVariantId(variant.id)
  try {
    const res = await fetch(`/api/products/${product.id}/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: draft.label, stock: Number(draft.stock) || 0 }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || 'No se pudo guardar la variante')
    }
    setVariantDrafts((prev) => {
      const next = { ...prev }
      delete next[variant.id]
      return next
    })
    mutate(variantsUrl)
  } catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Error al guardar la variante')
  } finally {
    setSavingVariantId(null)
  }
}

const handleDeleteVariant = async (variantId: string) => {
  if (!product?.id) return
  if (!confirm('¿Eliminar esta variante? Los presupuestos que ya la usaron no se ven afectados.')) return
  try {
    const res = await fetch(`/api/products/${product.id}/variants/${variantId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('No se pudo eliminar la variante')
    mutate(variantsUrl)
  } catch (err) {
    console.error(err)
    alert('Error al eliminar la variante')
  }
}

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

    const isCustom = categoryValue.startsWith('custom:')
    const payload = {
      ...formData,
      category: isCustom ? 'other' : categoryValue.slice('legacy:'.length),
      customCategoryId: isCustom ? categoryValue.slice('custom:'.length) : null,
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
      {/*
        flex + max-h para que el form nunca se desborde del contenedor
        padre (Dialog/Sheet). El bloque del medio scrollea, el footer
        de botones queda siempre visible.
        Si el Dialog padre no limita altura (ej. max-h-[90vh] overflow-hidden
        en DialogContent), este max-h de acá es el que manda.
      */}
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[85vh] flex-col sm:max-h-[80vh]"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-1 py-1">

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
              <Select value={categoryValue} onValueChange={handleCategorySelectChange}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Categorías del sistema
                    </SelectLabel>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={`legacy:${value}`}>{label}</SelectItem>
                    ))}
                  </SelectGroup>

                  {categories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Tus categorías
                      </SelectLabel>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={`custom:${c.id}`}>{c.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Otra</SelectLabel>
                    <SelectItem value={CREATE_CATEGORY_VALUE} className="flex items-center gap-1.5">
                      + Crear categoría...
                      {!hasCustomCategoriesFeature && <Crown className="h-3 w-3 text-amber-500" />}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {creatingCategory && (
                <div className="space-y-2 mt-1.5">
                  <Input
                    autoFocus
                    placeholder="Ej: Lonas, Servicios eléctricos..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                  />
                 <div className="flex justify-end gap-2">
                 <Button type="button" size="sm" variant="ghost" onClick={() => setCreatingCategory(false)}>
                   Cancelar
                 </Button>
                 <Button type="button" size="sm" onClick={handleCreateCategory} disabled={isSavingCategory || !newCategoryName.trim()}>
                   {isSavingCategory ? '...' : 'Crear'}
                 </Button>
               </div>
                </div>
              )}
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

{/* Activo (Switch independiente y limpio) */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="active" className="cursor-pointer font-medium">Producto activo</Label>
              <p className="text-xs text-muted-foreground">
                Los productos inactivos no aparecen al crear presupuestos
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          {/* Seccion Variantes Independiente */}
          {product?.id ? (
            hasVariantsFeature ? (
              <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/10">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Variantes y Stock</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Permite gestionar variantes (color, talle, terminación) con stock independiente para cada una.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {variants.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
                    </Badge>
                  )}
                </div>

                {variantsLoading ? (
                  <p className="text-xs text-muted-foreground py-2">Cargando variantes...</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {variants.map((v) => {
                      const draft = variantDrafts[v.id] ?? { label: v.label, stock: String(v.stock) }
                      const hasChanges = draft.label !== v.label || Number(draft.stock) !== v.stock

                      return (
                        <div key={v.id} className="flex items-center gap-2 bg-background p-1.5 rounded-md border border-border/60">
                          <Input
                            value={draft.label}
                            onChange={(e) =>
                              setVariantDrafts((prev) => ({
                                ...prev,
                                [v.id]: { ...draft, label: e.target.value }
                              }))
                            }
                            className="flex-1 h-8 text-sm"
                            placeholder="Ej: Rojo / XL"
                          />
                          <div className="w-28 relative">
                            <Input
                              type="number"
                              min={0}
                              value={draft.stock}
                              onChange={(e) =>
                                setVariantDrafts((prev) => ({
                                  ...prev,
                                  [v.id]: { ...draft, stock: e.target.value }
                                }))
                              }
                              className="h-8 text-sm pr-11"
                              placeholder="Stock"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground font-medium pointer-events-none">
                              un.
                            </span>
                          </div>

                          {hasChanges && (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => handleSaveVariant(v)}
                              disabled={savingVariantId === v.id}
                            >
                              {savingVariantId === v.id ? '...' : 'Guardar'}
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteVariant(v.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}

                    {variants.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-1">
                        No hay variantes creadas para este producto.
                      </p>
                    )}
                  </div>
                )}

                {/* Formulario de Alta rápida de variante */}
                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <Input
                    value={newVariantLabel}
                    onChange={(e) => setNewVariantLabel(e.target.value)}
                    placeholder="Agregar variante (ej: Azul, Talle M)..."
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                    placeholder="Stock"
                    className="w-24 h-8 text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 gap-1"
                    onClick={handleAddVariant}
                    disabled={isAddingVariant || !newVariantLabel.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Agregar</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    Variantes y Stock
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Gestioná colores, talles o terminaciones con stock independiente para cada uno.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>
                  Ver plan PRO
                </Button>
              </div>
            )
          ) : (
            <div className="rounded-lg border border-dashed border-border p-3 text-center bg-muted/20">
              <p className="text-xs text-muted-foreground">
                💡 Podrás agregar variantes (colores, talles, stock por opción) inmediatamente después de guardar y crear el producto.
              </p>
            </div>
          )}

        </div>

        {/* Footer fijo, siempre visible aunque el contenido de arriba scrollee */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-border pt-4 mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
          </Button>
        </div>
      </form>
      <UpgradeModal feature="productVariants" open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <UpgradeModal feature="customCategories" open={categoryUpgradeOpen} onOpenChange={setCategoryUpgradeOpen} />
    </TooltipProvider>
  )
}