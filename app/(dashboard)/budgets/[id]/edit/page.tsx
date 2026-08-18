'use client'
//app\(dashboard)\budgets\[id]\edit\page.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, ArrowLeft, Sparkles, Ruler, Loader2, ChevronDown, FileText } from 'lucide-react'
import useSWR from 'swr'
import { CATEGORY_LABELS, type Client, type ProductService } from '@/lib/types'
import type { ProductCategory } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies'
import { hasFeature } from '@/lib/features'
import { BudgetItemCalculator } from '@/components/budget/budget-item-calculator'
import { detectUnitType } from '@/lib/units'
import { Label } from '@/components/ui/label'
import { ProductPicker } from '@/components/budget/product-picker'

/* ================================
   TYPES & INTERFACES
   (alineados con new/page.tsx — se agregan productVariantId / variantLabel / cost)
================================ */
type BudgetItemInput = {
  id: string
  productServiceId: string | null
  productVariantId: string | null
  variantLabel: string | null
  name: string
  category?: ProductCategory
  quantity: number
  unitPrice: number
  cost: number | null // 👈 nuevo — solo se usa/muestra cuando isCustom
  unit?: string
  isCustom?: boolean
  widthCm:  number | null
  heightCm: number | null
  depthCm:  number | null
  direct:   number | null
  hours:    number | null
}

type Seller = {
  id: string
  name: string
  lastName: string
  active: boolean
}

type Installer = {
  id: string
  name: string
  lastName: string
  phone: string
  email?: string | null
  city?: string | null
  active: boolean
}

type ProductWithStock = ProductService & { stock?: number; currency: string }

/* ================================
   UTILS
================================ */
async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function buildInstallerReference(installer: Installer): string {
  const fullName = `${installer.name} ${installer.lastName}`.trim()
  const parts = [fullName]
  if (installer.city?.trim()) parts.push(installer.city.trim())
  if (installer.phone?.trim()) parts.push(installer.phone.trim())
  return parts.join(' - ')
}

/* Props compartidas entre la fila de tabla (desktop) y la card (mobile) */
type BudgetItemCellProps = {
  item: BudgetItemInput
  currency: string
  calculatorEnabled: boolean
  expandedCalcIds: Set<string>
  onToggleCalc: (id: string) => void
  onUpdateField: (id: string, field: keyof BudgetItemInput, value: any) => void
  onRemove: (id: string) => void
  getStock: (item: BudgetItemInput) => number
}

/* ================================
   BUDGET ITEM ROW (DESKTOP/TABLET) — igual a new/page.tsx
================================ */
const BudgetItemRow = React.memo(function BudgetItemRow({
  item,
  currency,
  calculatorEnabled,
  expandedCalcIds,
  onToggleCalc,
  onUpdateField,
  onRemove,
  getStock,
}: BudgetItemCellProps) {
  const handleQuantityChange = useCallback(
    (qty: number) => onUpdateField(item.id, 'quantity', qty),
    [item.id, onUpdateField]
  )

  const handleFieldChange = useCallback(
    (field: keyof BudgetItemInput, value: any) => onUpdateField(item.id, field, value),
    [item.id, onUpdateField]
  )

  const stock      = getStock(item)
  const isExpanded = expandedCalcIds.has(item.id)
  const showCalc   = calculatorEnabled && detectUnitType(item.unit) !== 'unit'

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>
          {item.isCustom ? (
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <Input
                placeholder="Nombre del servicio o producto a medida..."
                value={item.name}
                className={!item.name.trim() ? 'border-amber-400 focus-visible:ring-amber-400' : ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <span className="inline-flex w-max items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Personalizado
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.category ? CATEGORY_LABELS[item.category] : '—'}
                {item.variantLabel && (
                  <span className="ml-1 font-medium text-foreground">
                    · {item.variantLabel}
                  </span>
                )}
              </p>
            </div>
          )}

          {showCalc && (
            <button
              type="button"
              onClick={() => onToggleCalc(item.id)}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              <Ruler className="h-3 w-3" />
              {isExpanded ? 'Ocultar medidas' : 'Calcular medidas'}
            </button>
          )}
        </TableCell>

        <TableCell>
          <Input
            type="number"
            min={0.01}
            step="any"
            value={item.quantity === 0 ? '' : item.quantity}
            className={
              item.quantity <= 0 || (!item.isCustom && item.quantity > stock)
                ? 'border-destructive focus-visible:ring-destructive'
                : ''
            }
            onChange={(e) => handleFieldChange('quantity', Number(e.target.value))}
          />
        </TableCell>

        <TableCell className="text-right text-muted-foreground">
          {item.isCustom ? '—' : (
            <span className={item.quantity <= stock ? '' : 'text-destructive font-semibold'}>
              {stock}
            </span>
          )}
        </TableCell>

        <TableCell className="text-right">
          {item.isCustom ? (
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                className="pl-6 text-right"
                value={item.unitPrice}
                onChange={(e) => handleFieldChange('unitPrice', Number(e.target.value))}
              />
            </div>
          ) : (
            formatCurrency(item.unitPrice, currency)
          )}
        </TableCell>

        {/* ── COSTO (solo ítems libres) ── */}
        <TableCell className="text-right">
          {item.isCustom ? (
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                className="w-28 pl-6 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="Opcional"
                value={item.cost ?? ''}
                onChange={(e) => handleFieldChange('cost', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        <TableCell className="text-right font-medium">
          {formatCurrency(item.unitPrice * item.quantity, currency)}
        </TableCell>

        <TableCell>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </TableCell>
      </TableRow>

      {showCalc && isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/20 px-4 py-2">
            <BudgetItemCalculator
              unit={item.unit}
              unitPrice={item.unitPrice}
              currency={currency}
              widthCm={item.widthCm}
              heightCm={item.heightCm}
              depthCm={item.depthCm ?? null}
              direct={item.direct ?? null}
              hours={item.hours}
              onChange={(field, value) => handleFieldChange(field, value)}
              onQuantityChange={handleQuantityChange}
            />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  )
})

/* ================================
   BUDGET ITEM CARD (MOBILE)
================================ */
const BudgetItemCardMobile = React.memo(function BudgetItemCardMobile({
  item,
  currency,
  calculatorEnabled,
  expandedCalcIds,
  onToggleCalc,
  onUpdateField,
  onRemove,
  getStock,
}: BudgetItemCellProps) {
  const handleQuantityChange = useCallback(
    (qty: number) => onUpdateField(item.id, 'quantity', qty),
    [item.id, onUpdateField]
  )

  const handleFieldChange = useCallback(
    (field: keyof BudgetItemInput, value: any) => onUpdateField(item.id, field, value),
    [item.id, onUpdateField]
  )

  const stock      = getStock(item)
  const isExpanded = expandedCalcIds.has(item.id)
  const showCalc   = calculatorEnabled && detectUnitType(item.unit) !== 'unit'
  const overStock  = !item.isCustom && item.quantity > stock

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {item.isCustom ? (
            <div className="flex flex-col gap-1.5">
              <Input
                placeholder="Nombre del servicio o producto a medida..."
                value={item.name}
                className={!item.name.trim() ? 'border-amber-400 focus-visible:ring-amber-400' : ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <span className="inline-flex w-max items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Personalizado
              </span>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.category ? CATEGORY_LABELS[item.category] : '—'}
                {item.variantLabel && (
                  <span className="ml-1 font-medium text-foreground">
                    · {item.variantLabel}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Cantidad</p>
          <Input
            type="number"
            min={0.01}
            step="any"
            value={item.quantity === 0 ? '' : item.quantity}
            className={
              item.quantity <= 0 || overStock
                ? 'border-destructive focus-visible:ring-destructive'
                : ''
            }
            onChange={(e) => handleFieldChange('quantity', Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Stock</p>
          <div className="flex h-10 items-center text-sm">
            {item.isCustom ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <span className={overStock ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                {stock}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Precio Unit.</p>
          {item.isCustom ? (
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                className="pl-6"
                value={item.unitPrice}
                onChange={(e) => handleFieldChange('unitPrice', Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="flex h-10 items-center text-sm">
              {formatCurrency(item.unitPrice, currency)}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Subtotal</p>
          <div className="flex h-10 items-center text-sm font-medium">
            {formatCurrency(item.unitPrice * item.quantity, currency)}
          </div>
        </div>
      </div>

      {/* ── COSTO (solo ítems libres) ── */}
      {item.isCustom && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Costo (opcional)</p>
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              min={0}
              className="pl-6"
              placeholder="Lo que gastaste en este ítem"
              value={item.cost ?? ''}
              onChange={(e) => handleFieldChange('cost', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {showCalc && (
        <button
          type="button"
          onClick={() => onToggleCalc(item.id)}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Ruler className="h-3 w-3" />
          {isExpanded ? 'Ocultar medidas' : 'Calcular medidas'}
        </button>
      )}

      {showCalc && isExpanded && (
        <div className="rounded-md bg-muted/20 p-2">
          <BudgetItemCalculator
            unit={item.unit}
            unitPrice={item.unitPrice}
            currency={currency}
            widthCm={item.widthCm}
            heightCm={item.heightCm}
            depthCm={item.depthCm ?? null}
            direct={item.direct ?? null}
            hours={item.hours}
            onChange={(field, value) => handleFieldChange(field, value)}
            onQuantityChange={handleQuantityChange}
          />
        </div>
      )}
    </div>
  )
})

/* ================================
   PAGE
================================ */
export default function EditBudgetPage() {
  const router = useRouter()
  const params = useParams()
  const budgetId = params?.id as string

  const { data: clients   = [] } = useSWR<Client[]>('/api/clients', fetcher)
  const { data: products  = [] } = useSWR<ProductWithStock[]>('/api/products', fetcher)
  const { data: sellers   = [] } = useSWR<Seller[]>('/api/sellers', fetcher)
  const { data: installers = [] } = useSWR<Installer[]>('/api/installers', fetcher)
  const { data: branding }        = useSWR('/api/tenants', fetcher)

  const { data: existingBudget, isLoading: isLoadingBudget } = useSWR(
    budgetId ? `/api/budgets/${budgetId}` : null,
    fetcher
  )

  const companyName       = branding?.name || 'la empresa'
  const calculatorEnabled = hasFeature({ plan: branding?.plan, features: branding?.features }, 'calculator')

  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [hydrated, setHydrated]             = useState(false)
  const [clientId, setClientId]             = useState('')
  const [notes, setNotes]                   = useState('')
  const [items, setItems]                   = useState<BudgetItemInput[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariantId, setSelectedVariantId]  = useState('')
  const [expandedCalcIds, setExpandedCalcIds]     = useState<Set<string>>(new Set())
  const [currency, setCurrency]             = useState(DEFAULT_CURRENCY)
  const [installationResponsible, setInstallationResponsible] = useState('')
  const [installerId, setInstallerId]       = useState('')
  const [installerReference, setInstallerReference] = useState('')
  const [details, setDetails]               = useState([{ id: crypto.randomUUID(), title: '', value: '' }])
  const [discountType, setDiscountType]     = useState<'percentage' | 'fixed' | null>(null)
  const [discountValue, setDiscountValue]   = useState(0)
  const [taxPercentage, setTaxPercentage]   = useState(0)
  // Misma semántica que new/page.tsx:
  // shippingIncluded = true  -> el envío ya está incluido en el precio (sin cargo aparte)
  // shippingIncluded = false -> el envío se cobra aparte (puede ser 0 = envío gratis declarado)
  const [shippingIncluded, setShippingIncluded] = useState(true)
  const [shippingCost, setShippingCost]     = useState(0)
  const [shippingSectionOpen, setShippingSectionOpen] = useState(false)
  const [conditionsSectionOpen, setConditionsSectionOpen] = useState(false) // 👈 nuevo
  const [attachConditions, setAttachConditions] = useState(true) // 👈 nuevo — se hidrata del presupuesto existente
  const [paymentTerms, setPaymentTerms]     = useState('')
  const [validUntil, setValidUntil]         = useState('')
  const [sellerId, setSellerId]             = useState('')

  const selectedProductForAdd = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  )
  const selectedProductVariants = useMemo(
    () => selectedProductForAdd?.variants?.filter((v) => v.active) ?? [],
    [selectedProductForAdd]
  )

  // 🌟 hidratación única de todos los states a partir del budget existente
  useEffect(() => {
    if (!existingBudget || hydrated) return

    setClientId(existingBudget.clientId ?? '')
    setSellerId(existingBudget.sellerId ?? '')
    setInstallerId(existingBudget.installerId ?? '')
    setInstallationResponsible(existingBudget.installationResponsible ?? '')
    setInstallerReference(existingBudget.installerReference ?? '')
    setNotes(existingBudget.notes ?? '')
    setCurrency(existingBudget.currency ?? DEFAULT_CURRENCY)
    setPaymentTerms(existingBudget.paymentTerms ?? '')
    setValidUntil(
      existingBudget.validUntil
        ? new Date(existingBudget.validUntil).toISOString().slice(0, 10)
        : ''
    )

    // ⚠️ discountType no se persiste — reconstruimos como "fijo" con el monto ya calculado
    setDiscountType(existingBudget.discount > 0 ? 'fixed' : null)
    setDiscountValue(existingBudget.discount ?? 0)

    // taxPercentage tampoco se persiste — lo reconstruimos matemáticamente a partir del monto
    const taxedBase = Math.max(0, (existingBudget.subtotal ?? 0) - (existingBudget.discount ?? 0))
    const reconstructedTaxPct = taxedBase > 0 ? (existingBudget.tax / taxedBase) * 100 : 0
    setTaxPercentage(Math.round(reconstructedTaxPct * 100) / 100)

    // shippingCost persiste como número solo cuando se cobró aparte (ver new/page.tsx submit).
    // Si es null, asumimos "incluido / no discriminado" (mismo default que new).
    if (existingBudget.shippingCost !== null && existingBudget.shippingCost !== undefined) {
      setShippingIncluded(false)
      setShippingCost(existingBudget.shippingCost)
      setShippingSectionOpen(true)
    } else {
      setShippingIncluded(true)
      setShippingCost(0)
      setShippingSectionOpen(false)
    }

    // 👈 nuevo — hidrata el estado de "adjuntar condiciones" desde lo que se guardó al crear
    setAttachConditions(existingBudget.attachConditionsPdf !== false)

    setDetails(
      Array.isArray(existingBudget.details) && existingBudget.details.length > 0
        ? existingBudget.details.map((d: any) => ({
            id: d.id ?? crypto.randomUUID(),
            title: d.title ?? '',
            value: d.value ?? '',
          }))
        : [{ id: crypto.randomUUID(), title: '', value: '' }]
    )

    setItems(
      (existingBudget.items ?? []).map((it: any) => ({
        id: it.id,
        productServiceId: it.productServiceId,
        productVariantId: it.productVariantId ?? null,
        variantLabel: it.productVariant?.label ?? null,
        name: it.customName || it.productService?.name || '',
        category: it.productService?.category,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        cost: it.productServiceId ? null : (it.cost ?? null), // 👈 nuevo — solo relevante para ítems libres
        unit: it.productService?.unit || 'un.',
        isCustom: !it.productServiceId,
        widthCm: it.widthCm ?? null,
        heightCm: it.heightCm ?? null,
        depthCm: it.depthCm ?? null,
        direct: it.direct ?? null,
        hours: it.hours ?? null,
      }))
    )

    setHydrated(true)
  }, [existingBudget, hydrated])

  /* ================================
     MEMOS
  ================================ */
  const activeProducts  = useMemo(
    () => products.filter((p) => p.active && p.currency === currency),
    [products, currency]
  )
  const activeSellers   = useMemo(() => sellers.filter((s) => s.active), [sellers])
  const activeInstallers = useMemo(() => installers.filter((i) => i.active), [installers])

  const getStockForItem = useCallback(
    (item: Pick<BudgetItemInput, 'productServiceId' | 'productVariantId'>): number => {
      if (!item.productServiceId) return 999999
      const p = products.find((x) => x.id === item.productServiceId)
      if (!p) return 0
      if (item.productVariantId) {
        const v = p.variants?.find((v) => v.id === item.productVariantId)
        return typeof v?.stock === 'number' ? v.stock : 0
      }
      return typeof p.stock === 'number' ? p.stock : 0
    },
    [products]
  )

  const PAYMENT_TERMS_OPTIONS = [
    '50% seña, 50% contra entrega',
    'Contado',
    'Transferencia bancaria',
    'Tarjeta de crédito',
    'A convenir',
  ]
  const OTHER_PAYMENT_TERMS = '__other__'

  const [paymentTermsOption, setPaymentTermsOption] = useState('')

  const stockIssues = useMemo(() => {
    const totals = new Map<string, { productServiceId: string; productVariantId: string | null; label: string; quantity: number }>()
    for (const i of items) {
      if (i.isCustom || !i.productServiceId) continue
      const key = `${i.productServiceId}::${i.productVariantId ?? ''}`
      const existing = totals.get(key)
      if (existing) existing.quantity += i.quantity
      else totals.set(key, {
        productServiceId: i.productServiceId,
        productVariantId: i.productVariantId,
        label: i.variantLabel ? `${i.name} (${i.variantLabel})` : i.name,
        quantity: i.quantity,
      })
    }
    return Array.from(totals.entries())
      .map(([key, t]) => {
        const stock = getStockForItem(t)
        const missing = Math.max(0, t.quantity - stock)
        return { id: key, label: t.label, stock, missing }
      })
      .filter((x) => x.missing > 0)
  }, [items, getStockForItem])

  const hasStockIssues = stockIssues.length > 0

  /* ================================
     ITEMS OPERATORS
  ================================ */
  const addItem = useCallback(() => {
    if (!selectedProductId) return
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    const activeVariants = product.variants?.filter((v) => v.active) ?? []
    const hasVariants = activeVariants.length > 0
    if (hasVariants && !selectedVariantId) return

    const isMeasured = detectUnitType(product.unit) !== 'unit'
    const chosenVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null

    setItems((prev) => {
      if (!isMeasured && !hasVariants) {
        const existing = prev.find((i) => i.productServiceId === selectedProductId)
        if (existing) {
          return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i))
        }
      }
      if (!isMeasured && hasVariants) {
        const existing = prev.find(
          (i) => i.productServiceId === selectedProductId && i.productVariantId === selectedVariantId
        )
        if (existing) {
          return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i))
        }
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productServiceId: product.id,
          productVariantId: hasVariants ? selectedVariantId : null,
          variantLabel: chosenVariant?.label ?? null,
          name: product.name,
          category: product.category as ProductCategory,
          quantity: 1,
          unitPrice: product.price,
          cost: null,
          unit: product.unit,
          isCustom: false,
          widthCm: null,
          heightCm: null,
          depthCm: null,
          direct: null,
          hours: null,
        },
      ]
    })
    setSelectedProductId('')
    setSelectedVariantId('')
  }, [selectedProductId, selectedVariantId, products])

  const addCustomItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id:               crypto.randomUUID(),
        productServiceId: null,
        productVariantId: null,
        variantLabel:     null,
        name:             '',
        quantity:         1,
        unitPrice:        0,
        cost:             null, // 👈 nuevo
        unit:             'un.',
        isCustom:         true,
        widthCm:          null,
        heightCm:         null,
        depthCm:          null,
        direct:           null,
        hours:            null,
      },
    ])
  }, [])

  const updateItemField = useCallback(
    (id: string, field: keyof BudgetItemInput, value: any) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
      )
    },
    []
  )

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setExpandedCalcIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const toggleCalcExpanded = useCallback((id: string) => {
    setExpandedCalcIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  /* ================================
     DETAILS OPERATORS
  ================================ */
  const addDetail = () => {
    setDetails((prev) => [...prev, { id: crypto.randomUUID(), title: '', value: '' }])
  }

  const removeDetail = (id: string) => {
    setDetails((prev) => prev.filter((d) => d.id !== id))
  }

  const updateDetail = (id: string, field: 'title' | 'value', value: string) => {
    setDetails((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  /* ================================
     CÁLCULOS
  ================================ */
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const safeDiscountValue = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0
  const safeTaxPercentage = Number.isFinite(taxPercentage) ? Math.max(0, taxPercentage) : 0
  const safeShippingCost  = Number.isFinite(shippingCost)  ? Math.max(0, shippingCost)  : 0

  const rawDiscountAmount =
    discountType === 'percentage'
      ? subtotal * (Math.min(100, safeDiscountValue) / 100)
      : discountType === 'fixed'
        ? safeDiscountValue
        : 0

  const discountAmount  = Math.min(rawDiscountAmount, subtotal)
  const taxedBase       = Math.max(0, subtotal - discountAmount)
  const taxAmount       = taxedBase * (safeTaxPercentage / 100)
  // Igual que new/page.tsx: incluido = sin cargo extra; no incluido = se suma lo declarado
  const shippingAmount  = shippingIncluded ? 0 : safeShippingCost
  const total           = taxedBase + taxAmount + shippingAmount

  const hasInvalidQuantities = items.some((i) => i.quantity <= 0)
  const hasEmptyCustomNames  = items.some((i) => i.isCustom && !i.name.trim())

  /* ================================
     SUBMIT — PATCH
  ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || items.length === 0 || hasInvalidQuantities || hasEmptyCustomNames) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          installationResponsible,
          installerId: installationResponsible === 'company' ? installerId || null : null,
          installerReference,
          details: details.filter((d) => d.title.trim() || d.value.trim()),
          discountType,
          discountValue: safeDiscountValue,
          taxPercentage: safeTaxPercentage,
          sellerId:      sellerId || null,
          paymentTerms,
          validUntil,
          // null = envío incluido en el precio o no discriminado
          // número = costo de envío cobrado aparte (0 = gratis declarado)
          shippingCost: shippingSectionOpen && !shippingIncluded ? safeShippingCost : null,
          attachConditionsPdf: !!branding?.conditionsPdfUrl && attachConditions, // 👈 nuevo
          items: items.map((i) => ({
            productServiceId: i.productServiceId,
            productVariantId: i.productVariantId,
            customName:       i.isCustom ? i.name : null,
            quantity:         i.quantity,
            unitPrice:        i.unitPrice,
            cost:             i.isCustom ? i.cost : null, // 👈 nuevo
            subtotal:         i.unitPrice * i.quantity,
            widthCm:          i.widthCm  ?? null,
            heightCm:         i.heightCm ?? null,
            depthCm:          i.depthCm  ?? null,
            direct:           i.direct   ?? null,
            hours:            i.hours    ?? null,
          })),
        }),
      })

      if (!res.ok) throw new Error('Failed to update budget')
      router.push(`/budgets/${budgetId}`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ================================
     LOADING STATE
  ================================ */
  if (isLoadingBudget || !hydrated) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  /* ================================
     RENDER
  ================================ */
  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-x-hidden">
        <PageHeader
          title={`Editar Presupuesto #${String(existingBudget?.budgetNumber ?? 0).padStart(6, '0')}`}
          description="Modificá los datos y guardá los cambios"
        >
          <Link href={`/budgets/${budgetId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </Link>
        </PageHeader>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2 min-w-0">

              {/* MONEDA — deshabilitada, no se puede modificar tras crear */}
              <Card>
                <CardHeader><CardTitle>Moneda del presupuesto</CardTitle></CardHeader>
                <CardContent>
                  <Select value={currency} disabled>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-muted-foreground">
                    La moneda no se puede modificar una vez creado el presupuesto.
                  </p>
                </CardContent>
              </Card>

              {/* CLIENTE + VENDEDOR — cliente deshabilitado */}
              <Card>
                <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Vendedor</p>
                    <Select
                      value={sellerId || 'sin_asignar'}
                      onValueChange={(v) => setSellerId(v === 'sin_asignar' ? '' : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar vendedor..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                        {activeSellers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Cliente</p>
                    <Select value={clientId} disabled>
                      <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                      <SelectContent>
                        {[...clients]
                          .sort((a, b) => (a.company || a.name).localeCompare(b.company || b.name))
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.company} - {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs text-muted-foreground">
                      El cliente no se puede modificar una vez creado el presupuesto.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* PRODUCTOS / SERVICIOS — con soporte de variantes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Productos / Servicios</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomItem}
                    className="gap-1 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Item Libre (On-the-fly)
                  </Button>
                </CardHeader>
                <CardContent className="min-w-0 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <ProductPicker
                      products={activeProducts}
                      value={selectedProductId}
                      onChange={(id) => {
                        setSelectedProductId(id)
                        setSelectedVariantId('')
                      }}
                    />

                    {selectedProductVariants.length > 0 && (
                      <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                        <SelectTrigger className="w-full sm:w-[220px] border-amber-500/50 bg-amber-50/30">
                          <SelectValue placeholder="Elegí variante (color, talle)..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProductVariants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.label} — {v.stock} disp.
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      type="button"
                      onClick={addItem}
                      disabled={
                        !selectedProductId ||
                        (selectedProductVariants.length > 0 && !selectedVariantId)
                      }
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1 sm:mr-0" />
                      <span className="sm:hidden">Agregar al presupuesto</span>
                    </Button>
                  </div>

                  {selectedProductId && selectedProductVariants.length > 0 && !selectedVariantId && (
                    <p className="text-xs text-amber-600 font-medium animate-in fade-in-50">
                      ⚠️ Seleccioná una variante (ej: Borravino, Negro) para poder agregar este producto.
                    </p>
                  )}

                  {activeProducts.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No hay productos cargados en {currency}. Podés usar &quot;Item Libre&quot;.
                    </p>
                  )}

                  {items.length > 0 && (
                    <>
                      {/* Mobile */}
                      <div className="mt-4 space-y-3 sm:hidden">
                        {items.map((item) => (
                          <BudgetItemCardMobile
                            key={item.id}
                            item={item}
                            currency={currency}
                            calculatorEnabled={calculatorEnabled}
                            expandedCalcIds={expandedCalcIds}
                            onToggleCalc={toggleCalcExpanded}
                            onUpdateField={updateItemField}
                            onRemove={removeItem}
                            getStock={getStockForItem}
                          />
                        ))}
                      </div>

                      {/* Desktop */}
                      <div className="mt-4 hidden overflow-x-auto rounded-lg border sm:block">
                        <Table className="min-w-[720px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="w-[100px]">Cant.</TableHead>
                              <TableHead className="text-right w-[90px]">Stock</TableHead>
                              <TableHead className="text-right w-[140px]">Precio Unit.</TableHead>
                              <TableHead className="text-right w-[130px]">Costo</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                              <TableHead />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <BudgetItemRow
                                key={item.id}
                                item={item}
                                currency={currency}
                                calculatorEnabled={calculatorEnabled}
                                expandedCalcIds={expandedCalcIds}
                                onToggleCalc={toggleCalcExpanded}
                                onUpdateField={updateItemField}
                                onRemove={removeItem}
                                getStock={getStockForItem}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* DATOS DEL TRABAJO */}
              <Card>
                <CardHeader><CardTitle>Datos del Trabajo / Instalación</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={installationResponsible}
                    onValueChange={(value) => {
                      setInstallationResponsible(value)
                      setInstallerId('')
                      setInstallerReference('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Responsable de instalación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">A cargo del cliente</SelectItem>
                      <SelectItem value="company">A cargo de {companyName}</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>

                  {installationResponsible === 'company' && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Instalador</p>
                      <Select
                        value={installerId || 'sin_instalador'}
                        onValueChange={(value) => {
                          if (value === 'sin_instalador') {
                            setInstallerId('')
                            setInstallerReference('')
                            return
                          }
                          setInstallerId(value)
                          const sel = activeInstallers.find((i) => i.id === value)
                          if (sel) setInstallerReference(buildInstallerReference(sel))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar instalador..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sin_instalador">Sin asignar</SelectItem>
                          {activeInstallers.map((installer) => (
                            <SelectItem key={installer.id} value={installer.id}>
                              {installer.name} {installer.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Input
                    placeholder="Referencia del trabajador (opcional)"
                    value={installerReference}
                    onChange={(e) => setInstallerReference(e.target.value)}
                  />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Información adicional</p>
                    {details.map((detail) => (
                      <div key={detail.id} className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
                        <Input
                          placeholder="Título"
                          value={detail.title}
                          onChange={(e) => updateDetail(detail.id, 'title', e.target.value)}
                        />
                        <Input
                          placeholder="Contenido"
                          value={detail.value}
                          onChange={(e) => updateDetail(detail.id, 'value', e.target.value)}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDetail(detail.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addDetail}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar información
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* NOTAS */}
              <Card>
                <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms" className="text-sm font-normal text-muted-foreground">
                        Condiciones de pago
                      </Label>
                      <Select
                        value={paymentTermsOption}
                        onValueChange={(v) => {
                          setPaymentTermsOption(v)
                          setPaymentTerms(v === OTHER_PAYMENT_TERMS ? '' : v)
                        }}
                      >
                        <SelectTrigger id="paymentTerms">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TERMS_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                          <SelectItem value={OTHER_PAYMENT_TERMS}>Otro (especificar)</SelectItem>
                        </SelectContent>
                      </Select>

                      {paymentTermsOption === OTHER_PAYMENT_TERMS && (
                        <Input
                          placeholder="Ej: 50% efectivo, 50% transferencia"
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="mt-1.5"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validUntil" className="text-sm font-normal text-muted-foreground">
                        Válido hasta
                      </Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RESUMEN */}
            <div className="min-w-0">
              <Card className="lg:sticky lg:top-8">
                <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>

                  {/* DESCUENTO */}
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Descuento</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={discountType ?? 'none'}
                        onValueChange={(v) => {
                          if (v === 'none') { setDiscountType(null); setDiscountValue(0) }
                          else setDiscountType(v as 'percentage' | 'fixed')
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin</SelectItem>
                          <SelectItem value="fixed">Fijo</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        disabled={!discountType}
                        value={discountType ? safeDiscountValue : 0}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        placeholder={discountType === 'percentage' ? '%' : 'Monto'}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Aplicado</span>
                      <span>- {formatCurrency(discountAmount, currency)}</span>
                    </div>
                  </div>

                  {/* IVA */}
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">IVA (%)</span>
                    <Input
                      type="number"
                      min={0}
                      value={safeTaxPercentage}
                      onChange={(e) => setTaxPercentage(Number(e.target.value))}
                      placeholder="0"
                    />
                    <div className="flex justify-between text-sm">
                      <span>IVA</span>
                      <span>+ {formatCurrency(taxAmount, currency)}</span>
                    </div>
                  </div>

                  {/* ENVÍO — semántica corregida + acordeón como en new */}
                  <div className="space-y-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setShippingSectionOpen((v) => !v)}
                      className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      <span>Discriminar envío</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${shippingSectionOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {shippingSectionOpen && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Envío incluido en el precio</span>
                          <Switch
                            checked={shippingIncluded}
                            onCheckedChange={(checked) => {
                              setShippingIncluded(checked)
                              if (checked) setShippingCost(0)
                            }}
                          />
                        </div>
                        {!shippingIncluded && (
                          <Input
                            type="number"
                            min={0}
                            value={safeShippingCost}
                            onChange={(e) => setShippingCost(Number(e.target.value))}
                            placeholder="Costo de envío (0 = gratis)"
                          />
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Envío</span>
                          <span>
                            {shippingIncluded
                              ? 'Incluido'
                              : `+ ${formatCurrency(shippingAmount, currency)}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ADJUNTAR CONDICIONES — nuevo, faltaba en edit */}
                  {branding?.conditionsPdfUrl && (
                    <div className="space-y-2 border-t pt-3">
                      <button
                        type="button"
                        onClick={() => setConditionsSectionOpen((v) => !v)}
                        className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        <span>Adjuntar condiciones</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${conditionsSectionOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {conditionsSectionOpen && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm text-muted-foreground">
                                {branding.conditionsPdfName}
                              </span>
                            </div>
                            <Switch
                              checked={attachConditions}
                              onCheckedChange={setAttachConditions}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attachConditions
                              ? 'Se agregará como página adicional al final del PDF del presupuesto.'
                              : 'No se incluirá en este presupuesto.'}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total, currency)}</span>
                  </div>

                  {hasStockIssues && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                      <p className="font-semibold text-destructive">Stock insuficiente</p>
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {stockIssues.map((s) => (
                          <li key={s.id}>
                            <span className="font-medium">{s.label}</span> — faltan{' '}
                            <span className="font-semibold">{s.missing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!isSubmitting && (!clientId || items.length === 0 || hasInvalidQuantities || hasEmptyCustomNames) && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                        ⚠️ Datos pendientes
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {items.length === 0   && <li>Agregá al menos un producto o servicio.</li>}
                        {hasInvalidQuantities && <li>Hay ítems con cantidad inválida o en 0.</li>}
                        {hasEmptyCustomNames  && <li>Escribí el nombre de los ítems personalizados.</li>}
                      </ul>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full transition-all duration-200"
                    disabled={
                      isSubmitting ||
                      !clientId ||
                      items.length === 0 ||
                      hasInvalidQuantities ||
                      hasEmptyCustomNames
                    }
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}