'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Plus, Trash2, ArrowLeft, Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { CATEGORY_LABELS, type Client, type ProductService } from '@/lib/types'
import type { ProductCategory } from '@/lib/types'

/* ================================
   TYPES & INTERFACES
================================ */
type BudgetItemInput = {
  id: string
  productServiceId: string | null // Ahora permite null para ítems "On-the-fly"
  name: string
  category?: ProductCategory
  quantity: number
  unitPrice: number
  unit?: string
  isCustom?: boolean // Flag para identificar ítems libres
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

type ProductWithStock = ProductService & { stock?: number }

/* ================================
   UTILS
================================ */
async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

function buildInstallerReference(installer: Installer): string {
  const fullName = `${installer.name} ${installer.lastName}`.trim()
  const parts = [fullName]
  if (installer.city?.trim()) parts.push(installer.city.trim())
  if (installer.phone?.trim()) parts.push(installer.phone.trim())
  return parts.join(' - ')
}

/* ================================
   PAGE
================================ */
export default function NewBudgetPage() {
  const router = useRouter()

  const { data: clients = [] } = useSWR<Client[]>('/api/clients', fetcher)
  const { data: products = [] } = useSWR<ProductWithStock[]>('/api/products', fetcher)
  const { data: sellers = [] } = useSWR<Seller[]>('/api/sellers', fetcher)
  const { data: installers = [] } = useSWR<Installer[]>('/api/installers', fetcher)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<BudgetItemInput[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')

  /* ===== Datos del trabajo ===== */
  const { data: branding } = useSWR('/api/tenants', fetcher)
  const companyName = branding?.name || 'la empresa'
  const [installationResponsible, setInstallationResponsible] = useState('')
  const [installerId, setInstallerId] = useState('')
  const [installerReference, setInstallerReference] = useState('')
  const [details, setDetails] = useState([{ id: crypto.randomUUID(), title: '', value: '' }])

  /* ===== Avanzados ===== */
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null)
  const [discountValue, setDiscountValue] = useState(0)
  const [taxPercentage, setTaxPercentage] = useState(0)

  // Envío
  const [shippingIncluded, setShippingIncluded] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)

  const [paymentTerms, setPaymentTerms] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [sellerId, setSellerId] = useState('')

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products])
  const activeSellers = useMemo(() => sellers.filter((s) => s.active), [sellers])
  const activeInstallers = useMemo(() => installers.filter((i) => i.active), [installers])

  /* ================================
     STOCK HELPERS (UI)
  ================================ */
  const getStockByProductId = (productServiceId: string | null): number => {
    if (!productServiceId) return 999999 // Los ítems personalizados no tienen restricción de stock
    const p = products.find((x) => x.id === productServiceId)
    return typeof p?.stock === 'number' ? p.stock : 0
  }

  const stockIssues = useMemo(() => {
    return items
      .filter((i) => !i.isCustom && i.productServiceId) // Solo evaluamos stock de ítems reales de la DB
      .map((i) => {
        const stock = getStockByProductId(i.productServiceId)
        const missing = Math.max(0, i.quantity - stock)
        return { id: i.productServiceId!, stock, missing }
      })
      .filter((x) => x.missing > 0)
  }, [items, products])

  const hasStockIssues = stockIssues.length > 0

  /* ================================
     ITEMS OPERATORS
  ================================ */
  const addItem = () => {
    if (!selectedProductId) return
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    if (items.some((i) => i.productServiceId === selectedProductId)) {
      setItems((prev) =>
        prev.map((i) =>
          i.productServiceId === selectedProductId ? { ...i, quantity: i.quantity + 1 } : i
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          productServiceId: product.id,
          name: product.name,
          category: product.category as ProductCategory,
          quantity: 1,
          unitPrice: product.price,
          unit: product.unit,
          isCustom: false,
        },
      ])
    }
    setSelectedProductId('')
  }

  // ✨ NUEVA FUNCIÓN: Agregar ítem vacío "On-the-fly"
  const addCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productServiceId: null,
        name: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'un.',
        isCustom: true,
      },
    ])
  }

  const updateItemField = (id: string, field: keyof BudgetItemInput, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  /* ================================
     ADDITIONAL DETAILS OPERATORS
  ================================ */
  const addDetail = () => {
    setDetails((prev) => [...prev, { id: crypto.randomUUID(), title: '', value: '' }])
  }

  const removeDetail = (id: string) => {
    setDetails((prev) => prev.filter((detail) => detail.id !== id))
  }

  const updateDetail = (id: string, field: 'title' | 'value', value: string) => {
    setDetails((prev) =>
      prev.map((detail) => (detail.id === id ? { ...detail, [field]: value } : detail))
    )
  }

  /* ================================
     CALCULOS (UI)
  ================================ */
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  const safeDiscountValue = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0
  const safeTaxPercentage = Number.isFinite(taxPercentage) ? Math.max(0, taxPercentage) : 0
  const safeShippingCost = Number.isFinite(shippingCost) ? Math.max(0, shippingCost) : 0

  const rawDiscountAmount =
    discountType === 'percentage'
      ? subtotal * (Math.min(100, safeDiscountValue) / 100)
      : discountType === 'fixed'
        ? safeDiscountValue
        : 0

  const discountAmount = Math.min(rawDiscountAmount, subtotal)
  const taxedBase = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxedBase * (safeTaxPercentage / 100)
  const shippingAmount = shippingIncluded ? safeShippingCost : 0

  const total = taxedBase + taxAmount + shippingAmount

  const hasInvalidQuantities = items.some((i) => i.quantity <= 0)
  const hasEmptyCustomNames = items.some((i) => i.isCustom && !i.name.trim())

  /* ================================
     SUBMIT (Corregido para tu esquema de Prisma)
  ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || items.length === 0 || hasInvalidQuantities || hasEmptyCustomNames) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          notes,
          installationResponsible,
          installerId: installationResponsible === 'company' ? installerId || null : null,
          installerReference,
          details: details.filter((d) => d.title.trim() || d.value.trim()),
          discountType,
          discountValue: safeDiscountValue,
          taxPercentage: safeTaxPercentage,
          sellerId: sellerId || null,
          paymentTerms,
          validUntil,
          shippingCost: shippingIncluded ? safeShippingCost : null,
          // Mapeo exacto hacia tu modelo BudgetItem de la DB:
          items: items.map((i) => ({
            productServiceId: i.productServiceId, // Almacena el ID o null si es On-the-fly
            customName: i.isCustom ? i.name : null, // 🌟 Usa 'customName' que es lo que espera tu modelo
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.unitPrice * i.quantity,
          })),
          total,
        }),
      })

      if (!res.ok) throw new Error('Failed to create budget')

      const budget = await res.json()
      router.push(`/budgets/${budget.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <PageHeader title="Nuevo Presupuesto" description="Crea una nueva cotización">
          <Link href="/budgets">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </Link>
        </PageHeader>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* CLIENTE + VENDEDOR */}
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Vendedor</p>
                    <Select
                      value={sellerId || 'sin_asignar'}
                      onValueChange={(v) => setSellerId(v === 'sin_asignar' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vendedor..." />
                      </SelectTrigger>
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
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.company} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* PRODUCTOS */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Productos / Servicios</CardTitle>
                  {/* Botón para forzar la inserción libre */}
                  <Button type="button" variant="outline" size="sm" onClick={addCustomItem} className="gap-1 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Item Libre (On-the-fly)
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar de la lista base..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} – {formatCurrency(p.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button type="button" onClick={addItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {items.length > 0 && (
                    <div className="mt-4 rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="w-[100px]">Cant.</TableHead>
                            <TableHead className="text-right w-[90px]">Stock</TableHead>
                            <TableHead className="text-right w-[140px]">Precio Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.isCustom ? (
                                  // Agregamos flex flex-col y gap para que el badge se acomode abajo sin desbordar
                                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                                    <Input
                                      placeholder="Nombre del servicio o producto a medida..."
                                      value={item.name}
                                      className={!item.name.trim() ? 'border-amber-400 focus-visible:ring-amber-400' : ''}
                                      onChange={(e) => updateItemField(item.id, 'name', e.target.value)}
                                    />
                                    {/* Al usar w-max evitamos que el badge se estire al ancho completo del input */}
                                    <span className="inline-flex w-max items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                      <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Personalizado
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.category ? CATEGORY_LABELS[item.category] : '—'}
                                    </p>
                                  </div>
                                )}
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity === 0 ? '' : item.quantity}
                                  className={
                                    item.quantity <= 0 || (!item.isCustom && item.quantity > getStockByProductId(item.productServiceId))
                                      ? 'border-destructive focus-visible:ring-destructive'
                                      : ''
                                  }
                                  onChange={(e) => updateItemField(item.id, 'quantity', Number(e.target.value))}
                                />
                              </TableCell>

                              <TableCell className="text-right text-muted-foreground">
                                {item.isCustom ? '—' : (
                                  (() => {
                                    const stock = getStockByProductId(item.productServiceId)
                                    const ok = item.quantity <= stock
                                    return <span className={ok ? '' : 'text-destructive font-semibold'}>{stock}</span>
                                  })()
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
                                      onChange={(e) => updateItemField(item.id, 'unitPrice', Number(e.target.value))}
                                    />
                                  </div>
                                ) : (
                                  formatCurrency(item.unitPrice)
                                )}
                              </TableCell>

                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </TableCell>

                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DATOS DEL TRABAJO */}
              <Card>
                <CardHeader>
                  <CardTitle>Datos del Trabajo / Instalación</CardTitle>
                </CardHeader>
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
                          const selectedInstaller = activeInstallers.find((i) => i.id === value)
                          if (selectedInstaller) {
                            setInstallerReference(buildInstallerReference(selectedInstaller))
                          }
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
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      placeholder="Condiciones de pago (opcional)"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                    <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RESUMEN */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {/* DESCUENTO */}
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Descuento</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={discountType ?? 'none'}
                        onValueChange={(v) => {
                          if (v === 'none') {
                            setDiscountType(null)
                            setDiscountValue(0)
                          } else {
                            setDiscountType(v as 'percentage' | 'fixed')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                      <span>- {formatCurrency(discountAmount)}</span>
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
                      <span>+ {formatCurrency(taxAmount)}</span>
                    </div>
                  </div>

                  {/* ENVÍO */}
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Envío incluido</span>
                      <Switch
                        checked={shippingIncluded}
                        onCheckedChange={(checked) => {
                          setShippingIncluded(checked)
                          if (!checked) setShippingCost(0)
                        }}
                      />
                    </div>
                    {shippingIncluded && (
                      <Input
                        type="number"
                        min={0}
                        value={safeShippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value))}
                        placeholder="Costo de envío"
                      />
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Envío</span>
                      <span>{shippingIncluded ? `+ ${formatCurrency(shippingAmount)}` : '—'}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>

                  {/* CONTROL DE STOCK EXCLUSIVO PARA ÍTEMS DB */}
                  {hasStockIssues && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                      <p className="font-semibold text-destructive">Stock insuficiente</p>
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {stockIssues.map((s) => {
                          const it = items.find((i) => i.productServiceId === s.id)
                          return (
                            <li key={s.id}>
                              <span className="font-medium">{it?.name ?? 'Item'}</span> — faltan{' '}
                              <span className="font-semibold">{s.missing}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* FEEDBACK DE VALIDACIONES */}
                  {!isSubmitting && (!clientId || items.length === 0 || hasInvalidQuantities || hasEmptyCustomNames) && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                        ⚠️ Datos pendientes
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {!clientId && <li>Falta seleccionar el **cliente**.</li>}
                        {items.length === 0 && <li>Agregá al menos un **producto o servicio**.</li>}
                        {hasInvalidQuantities && <li>Hay ítems con cantidad inválida o en **0**.</li>}
                        {hasEmptyCustomNames && <li>Escribí el nombre de los ítems personalizados.</li>}
                      </ul>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full transition-all duration-200"
                    disabled={isSubmitting || !clientId || items.length === 0 || hasInvalidQuantities || hasEmptyCustomNames}
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Presupuesto'}
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