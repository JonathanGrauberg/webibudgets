'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import useSWR from 'swr'
import { CATEGORY_LABELS, type Client, type ProductService } from '@/lib/types'
import type { ProductCategory } from '@/lib/types'

/* ================================
   TYPES
================================ */
type BudgetItemInput = {
  id: string
  productServiceId: string
  name: string
  category?: ProductCategory
  quantity: number
  unitPrice: number
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

function buildInstallerReference(installer: Installer) {
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
  const { data: products = [] } = useSWR<ProductService[]>('/api/products', fetcher)
  const { data: sellers = [] } = useSWR<Seller[]>('/api/sellers', fetcher)
  const { data: installers = [] } = useSWR<Installer[]>('/api/installers', fetcher)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<BudgetItemInput[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')

  /* ===== Datos del trabajo ===== */
  const [installationResponsible, setInstallationResponsible] = useState('')
  const [installerId, setInstallerId] = useState('')
  const [installerReference, setInstallerReference] = useState('')
  const [siteDetails, setSiteDetails] = useState('')
  const [technicalDetails, setTechnicalDetails] = useState('')

  /* ===== Avanzados ===== */
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null)
  const [discountValue, setDiscountValue] = useState(0)
  const [taxPercentage, setTaxPercentage] = useState(0)

  // ✅ Envío
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
  const getStockByProductId = (productServiceId: string) => {
    const p = products.find((x) => x.id === productServiceId)
    return typeof (p as any)?.stock === 'number' ? (p as any).stock : 0
  }

  const stockIssues = useMemo(() => {
    return items
      .map((i) => {
        const stock = getStockByProductId(i.productServiceId)
        const missing = Math.max(0, i.quantity - stock)
        return { id: i.productServiceId, stock, missing }
      })
      .filter((x) => x.missing > 0)
  }, [items, products])

  const hasStockIssues = stockIssues.length > 0

  /* ================================
     INSTALLERS
  ================================ */
  useEffect(() => {
    if (installationResponsible !== 'company') {
      setInstallerId('')
      return
    }

    if (!installerId) return

    const installer = activeInstallers.find((i) => i.id === installerId)
    if (!installer) return

    setInstallerReference(buildInstallerReference(installer))
  }, [installationResponsible, installerId, activeInstallers])

  /* ================================
     ITEMS
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
        },
      ])
    }

    setSelectedProductId('')
  }

  const updateQuantity = (productServiceId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) return
    setItems((prev) =>
      prev.map((i) => (i.productServiceId === productServiceId ? { ...i, quantity } : i))
    )
  }

  const removeItem = (productServiceId: string) => {
    setItems((prev) => prev.filter((i) => i.productServiceId !== productServiceId))
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

  /* ================================
     SUBMIT
  ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || items.length === 0) return

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
          siteDetails,
          technicalDetails,

          discountType,
          discountValue: safeDiscountValue,
          taxPercentage: safeTaxPercentage,

          sellerId: sellerId || null,

          paymentTerms,
          validUntil,

          shippingCost: shippingIncluded ? safeShippingCost : null,

          items: items.map((i) => ({
            productServiceId: i.productServiceId,
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

  /* ================================
     UI
  ================================ */
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
                <CardHeader>
                  <CardTitle>Productos / Servicios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar producto..." />
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
                            <TableHead>Cant.</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.productServiceId}>
                              <TableCell>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.category ? CATEGORY_LABELS[item.category] : '—'}
                                </p>
                              </TableCell>

                              <TableCell>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  className={
                                    item.quantity > getStockByProductId(item.productServiceId)
                                      ? 'border-destructive focus-visible:ring-destructive'
                                      : ''
                                  }
                                  onChange={(e) =>
                                    updateQuantity(item.productServiceId, Number(e.target.value))
                                  }
                                />
                              </TableCell>

                              <TableCell className="text-right">
                                {(() => {
                                  const stock = getStockByProductId(item.productServiceId)
                                  const ok = item.quantity <= stock
                                  return (
                                    <span className={ok ? '' : 'text-destructive font-semibold'}>
                                      {stock}
                                    </span>
                                  )
                                })()}
                              </TableCell>

                              <TableCell className="text-right">
                                {formatCurrency(item.unitPrice)}
                              </TableCell>

                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </TableCell>

                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeItem(item.productServiceId)}
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

                      if (value !== 'company') {
                        setInstallerId('')
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Responsable de instalación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">A cargo del cliente</SelectItem>
                      <SelectItem value="company">A cargo de Ecoservicios</SelectItem>
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
                    placeholder="Referencia instalador de la zona"
                    value={installerReference}
                    onChange={(e) => setInstallerReference(e.target.value)}
                  />

                  <Textarea
                    placeholder="Datos del lugar / uso"
                    value={siteDetails}
                    onChange={(e) => setSiteDetails(e.target.value)}
                  />

                  <Textarea
                    placeholder="Observaciones técnicas"
                    value={technicalDetails}
                    onChange={(e) => setTechnicalDetails(e.target.value)}
                  />
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
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                    />
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

                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Envío incluido</span>
                      <Switch checked={shippingIncluded} onCheckedChange={setShippingIncluded} />
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

                  <Button
                    type="submit"
                    disabled={isSubmitting || !clientId || items.length === 0}
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