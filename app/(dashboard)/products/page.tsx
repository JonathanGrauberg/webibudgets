'use client'
// app\(dashboard)\products\page.tsx
import { hasFeature } from '@/lib/features'
import { LockedButton } from '@/components/feature-gate'
import { ProductServiceOrganizer } from '@/components/products/product-service-organizer'
import React, { Suspense, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Plus, Search, Pencil, Trash2, Tag, CircleDollarSign, Package, Percent, RefreshCw, ChevronDown, ChevronRight, Eye, EyeOff, LayoutList, Layers, Shuffle } from 'lucide-react'
import { ProductForm } from '@/components/product-form'
import useSWR, { mutate } from 'swr'
import type { ProductService, ProductCategory } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency } from '@/lib/format'

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

async function fetchTenantBranding() {
  const res = await fetch('/api/tenants')
  if (!res.ok) throw new Error('Failed to fetch tenant')
  return res.json()
}

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  biodigesters: 'bg-emerald-100 text-emerald-800',
  grease_traps: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-amber-100 text-amber-800',
  other: 'bg-gray-100 text-gray-800',
}

function Loading() {
  return null
}

function getCostMetrics(product: ProductService) {
  const cost = product.cost ?? null
  const ganancia = cost != null ? product.price - cost : null
  const margen = cost != null && product.price > 0
    ? ((product.price - cost) / product.price) * 100
    : null
  const isM2 = product.unit === 'm²'

  return { cost, ganancia, margen, isM2 }
}

function getCatalogMetrics(products: ProductService[]) {
  const total = products.length
  const active = products.filter((p) => p.active).length

  const withMargin = products
    .map((p) => {
      if (p.cost == null || p.price <= 0) return null
      return ((p.price - p.cost) / p.price) * 100
    })
    .filter((m): m is number => m !== null)

  const avgMargin = withMargin.length
    ? withMargin.reduce((acc, m) => acc + m, 0) / withMargin.length
    : null

  const lowMarginCount = withMargin.filter((m) => m < 25).length

  return { total, active, avgMargin, lowMarginCount }
}

type ViewMode = 'flat' | 'grouped' | 'organizer'
type SortBy = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export default function ProductsPage() {
  const { canEdit } = usePermissions()
  const canEditProducts = canEdit('products')

  const { data: products = [], isLoading } = useSWR<ProductService[]>('/api/products', fetchProducts)
  const { data: tenantBranding } = useSWR('/api/tenants', fetchTenantBranding) // 👈 esto va primero

  const canBulkUpdate = hasFeature(
    { plan: tenantBranding?.plan, features: tenantBranding?.features },
    'bulkPriceUpdate'
  )

  // Estados para Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false) // 👈 Ocultos por defecto

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null)

  // Desplegable de variantes
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Desplegable de categorías (vista agrupada)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  // Orden y modo de vista
  const [sortBy, setSortBy] = useState<SortBy>('name-asc')
  const [viewMode, setViewMode] = useState<ViewMode>('flat')

  // Actualización masiva de precios
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [bulkPercentage, setBulkPercentage] = useState('')
  const [bulkCategory, setBulkCategory] = useState('all')
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)

  // Aplicación de los Filtros (Búsqueda, Categoría y Estado Inactivo)
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter

    const matchesActiveStatus = showInactive ? true : product.active

    return matchesSearch && matchesCategory && matchesActiveStatus
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (sortBy === 'price-asc') return a.price - b.price
    return b.price - a.price // price-desc
  })

  const groupedByCategory = sortedProducts.reduce((acc, p) => {
    const key = p.category
    ;(acc[key] ??= []).push(p)
    return acc
  }, {} as Record<string, typeof sortedProducts>)

  const handleCreate = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: ProductService) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar o inhabilitar este producto/servicio?')) return

    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    mutate('/api/products')
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    mutate('/api/products')
  }

  const handleBulkUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pct = Number(bulkPercentage)

    if (!bulkPercentage || isNaN(pct) || pct === 0) {
      alert('Por favor, ingresá un porcentaje numérico válido diferente de 0.')
      return
    }

    const confirmMsg = bulkCategory === 'all'
      ? `¿Estás seguro de que querés actualizar masivamente el precio de TODOS los productos en un ${pct}%?`
      : `¿Estás seguro de que querés actualizar el precio de la categoría seleccionada en un ${pct}%?`

    if (!confirm(confirmMsg)) return

    try {
      setIsSubmittingBulk(true)
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: pct,
          category: bulkCategory === 'all' ? undefined : bulkCategory
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al actualizar precios')
      }

      const result = await res.json()
      alert(`¡Éxito! Se actualizaron los precios de ${result.count} productos.`)

      setBulkPercentage('')
      setBulkCategory('all')
      setIsBulkOpen(false)
      mutate('/api/products')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setIsSubmittingBulk(false)
    }
  }

  const handleOrganizerChange = async (serviceProductIds: string[]) => {
    await fetch('/api/products/organizer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceProductIds }),
    })
    mutate('/api/tenants')
  }

  // Fila de un producto — se reusa en la vista plana y en la agrupada
  function renderProductRow(product: ProductService) {
    const { cost, ganancia, margen } = getCostMetrics(product)
    const hasVariants = product.variants && product.variants.length > 0
    const isExpanded = !!expandedProductIds[product.id]

    return (
      <React.Fragment key={product.id}>
        <TableRow className={`${isExpanded ? 'bg-muted/30 border-b-0' : ''} ${!product.active ? 'opacity-60 bg-muted/10' : ''}`}>
          {/* Flechita para desplegar */}
          <TableCell className="p-2">
            {hasVariants ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleExpand(product.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            ) : null}
          </TableCell>

          <TableCell>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="line-clamp-2 font-medium text-card-foreground break-words">
                  {product.name}
                </p>
                {hasVariants && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                    {product.variants?.length} variantes
                  </Badge>
                )}
              </div>
              <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                {product.description}
              </p>
            </div>
          </TableCell>

          <TableCell>
            <Badge className={CATEGORY_COLORS[product.category]}>
              {CATEGORY_LABELS[product.category]}
            </Badge>
          </TableCell>

          <TableCell className="text-right">
            {cost != null ? formatCurrency(cost, product.currency) : '—'}
          </TableCell>

          <TableCell className="text-right font-medium">
            <div className="flex items-center justify-end gap-1.5">
              {formatCurrency(product.price, product.currency)}
              {product.currency !== 'ARS' && (
                <Badge variant="outline" className="text-[10px] px-1.5">
                  {product.currency}
                </Badge>
              )}
            </div>
          </TableCell>

          <TableCell className="text-right">
            {ganancia != null ? formatCurrency(ganancia, product.currency) : '—'}
          </TableCell>

          <TableCell className="text-right">
            {margen != null ? (
              <Badge className={margen < 25 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-800'}>
                {margen.toFixed(0)}%
              </Badge>
            ) : '—'}
          </TableCell>

          <TableCell className="text-muted-foreground">
            {product.unit}
          </TableCell>

          <TableCell>
            <Badge variant={product.active ? 'default' : 'secondary'}>
              {product.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </TableCell>

          {canEditProducts && (
            <TableCell>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar producto</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar producto</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          )}
        </TableRow>

        {/* FILA DESPLEGABLE CON VARIANTES */}
        {hasVariants && isExpanded && (
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableCell colSpan={canEditProducts ? 10 : 9} className="py-2 pl-12 pr-6">
              <div className="rounded-lg border bg-background p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Variantes disponibles
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {product.variants?.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded border bg-muted/10 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-foreground">{v.label}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {v.stock} u.
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <TooltipProvider>
        <div className="min-h-screen">
          <PageHeader
            title="Productos y Servicios"
            description="Administra tu catálogo de productos y lista de precios"
          >
            {canEditProducts && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {canBulkUpdate ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => setIsBulkOpen(true)} variant="outline" className="w-full sm:w-auto">
                        <Percent className="mr-2 h-4 w-4" />
                        Actualizar Precios
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Modificar precios de forma masiva por porcentaje</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <LockedButton feature="bulkPriceUpdate" className="w-full sm:w-auto">
                        Actualizar Precios
                      </LockedButton>
                    </TooltipTrigger>
                    <TooltipContent>Función disponible en el plan PRO</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCreate} id="tour-create-product" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Producto
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Agregar un nuevo producto o servicio</TooltipContent>
                </Tooltip>
              </div>
            )}
          </PageHeader>

          <div className="p-4 md:p-6 lg:p-8">
            {!isLoading && products.length > 0 && (() => {
              const { total, active, avgMargin, lowMarginCount } = getCatalogMetrics(products)
              return (
                <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold text-card-foreground">{total}</span>
                    <span className="text-muted-foreground">productos</span>
                  </div>
                  <div className="hidden h-3 w-px bg-border sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-card-foreground">{active}</span>
                    <span className="text-muted-foreground">activos</span>
                  </div>
                  {avgMargin != null && (
                    <>
                      <div className="hidden h-3 w-px bg-border sm:block" />
                      <div className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-card-foreground">{avgMargin.toFixed(0)}%</span>
                        <span className="text-muted-foreground">margen promedio</span>
                      </div>
                    </>
                  )}
                  {lowMarginCount > 0 && (
                    <>
                      <div className="hidden h-3 w-px bg-border sm:block" />
                      <div className="flex items-center gap-1.5 text-orange-600">
                        <span className="font-semibold">{lowMarginCount}</span>
                        <span>con margen bajo</span>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Barra de Filtros + Orden + Switch Ocultar/Mostrar Inactivos */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos o servicios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v: SortBy) => setSortBy(v)}>
                  <SelectTrigger className="w-full sm:w-[190px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                    <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                    <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle de Inactivos */}
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium shrink-0 self-start sm:self-auto">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="cursor-pointer flex items-center gap-1.5">
                  {showInactive ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Mostrando inactivos</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Ocultando inactivos</span>
                    </>
                  )}
                </Label>
              </div>
            </div>

            {/* Switch de modo de vista */}
            <div className="mb-6 flex gap-1 rounded-lg border bg-muted/40 p-0.5 w-fit">
              {([
                { value: 'flat', label: 'Lista', icon: LayoutList },
                { value: 'grouped', label: 'Por categoría', icon: Layers },
                { value: 'organizer', label: 'Organizador', icon: Shuffle },
              ] as const).map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setViewMode(opt.value)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      viewMode === opt.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {viewMode === 'organizer' ? (
              <ProductServiceOrganizer
                products={products}
                serviceProductIds={tenantBranding?.serviceProductIds ?? []}
                onChange={handleOrganizerChange}
              />
            ) : isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Cargando productos...</p>
                </CardContent>
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-center text-muted-foreground">
                    {searchQuery || categoryFilter !== 'all'
                      ? 'No se encontraron productos con los filtros aplicados.'
                      : 'No hay productos registrados'}
                  </p>

                  {!searchQuery && categoryFilter === 'all' && canEditProducts && (
                    <Button variant="link" onClick={handleCreate} className="mt-2">
                      Crear primer producto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* MOBILE: cards (siempre en orden plano, el acordeón de categoría es solo desktop) */}
                <div className="space-y-4 md:hidden">
                  {sortedProducts.map((product) => {
                    const { cost, margen } = getCostMetrics(product)
                    const hasVariants = product.variants && product.variants.length > 0
                    const isExpanded = !!expandedProductIds[product.id]

                    return (
                      <Card key={product.id} className={!product.active ? 'opacity-60 bg-muted/20' : ''}>
                        <CardContent className="space-y-4 p-4">
                          <div className="space-y-1">
                            <p className="font-medium text-card-foreground">
                              {product.name}
                            </p>
                            <p className="text-sm text-muted-foreground break-words">
                              {product.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className={CATEGORY_COLORS[product.category]}>
                              {CATEGORY_LABELS[product.category]}
                            </Badge>

                            <Badge variant={product.active ? 'default' : 'secondary'}>
                              {product.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">Precio</span>
                              <span className="font-semibold text-card-foreground">
                                {formatCurrency(product.price, product.currency)}
                              </span>
                            </div>

                            {hasVariants && (
                              <div className="mt-2 rounded-md border bg-muted/20 p-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(product.id)}
                                  className="flex w-full items-center justify-between text-xs font-semibold text-primary"
                                >
                                  <span>Variantes ({product.variants?.length})</span>
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>

                                {isExpanded && (
                                  <div className="mt-2 space-y-1 border-t pt-2">
                                    {product.variants?.map((v) => (
                                      <div key={v.id} className="flex justify-between text-xs text-muted-foreground">
                                        <span>• {v.label}</span>
                                        <span className="font-mono">{v.stock} disp.</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {canEditProducts && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Button>

                              <Button
                                variant="outline"
                                className="flex-1 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* DESKTOP: Tabla */}
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead className="w-[26%]">Producto / Servicio</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Ganancia</TableHead>
                            <TableHead className="text-right">Margen</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead>Estado</TableHead>
                            {canEditProducts && (
                              <TableHead className="w-[100px]">Acciones</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {viewMode === 'flat'
                            ? sortedProducts.map((product) => renderProductRow(product))
                            : Object.entries(groupedByCategory).map(([category, items]) => {
                                const isCategoryOpen = expandedCategories[category] !== false // 👈 arranca abierta

                                return (
                                  <React.Fragment key={category}>
                                    <TableRow
                                      className="cursor-pointer bg-muted/40 hover:bg-muted/50"
                                      onClick={() => toggleCategory(category)}
                                    >
                                      <TableCell colSpan={canEditProducts ? 10 : 9} className="py-2.5">
                                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                          {isCategoryOpen ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                          {CATEGORY_LABELS[category as ProductCategory] ?? category}
                                          <Badge variant="secondary" className="ml-1 text-[10px]">{items.length}</Badge>
                                        </div>
                                      </TableCell>
                                    </TableRow>

                                    {isCategoryOpen && items.map((product) => renderProductRow(product))}
                                  </React.Fragment>
                                )
                              })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Modal Edición / Creación */}
          {canEditProducts && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </DialogTitle>
                </DialogHeader>

                <ProductForm
                  product={editingProduct}
                  defaultCurrency={tenantBranding?.currency}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Modal Actualización Masiva */}
          {canEditProducts && (
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
              <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Actualización Masiva de Precios</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleBulkUpdateSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="bulkPercentage">Porcentaje de Ajuste</Label>
                    <div className="relative">
                      <Input
                        id="bulkPercentage"
                        type="number"
                        placeholder="Ej: 10 para aumentar o -5 para rebajar"
                        value={bulkPercentage}
                        onChange={(e) => setBulkPercentage(e.target.value)}
                        required
                        disabled={isSubmittingBulk}
                      />
                      <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulkCategory">Categoría a Afectar</Label>
                    <Select value={bulkCategory} onValueChange={setBulkCategory} disabled={isSubmittingBulk}>
                      <SelectTrigger id="bulkCategory" className="w-full">
                        <SelectValue placeholder="Seleccionar alcance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todo el catálogo completo</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            Solo {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBulkOpen(false)}
                      disabled={isSubmittingBulk}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmittingBulk}>
                      {isSubmittingBulk ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Aplicar Ajuste'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </TooltipProvider>
    </Suspense>
  )
}