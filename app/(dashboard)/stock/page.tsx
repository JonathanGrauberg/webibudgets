'use client'
//app\(dashboard)\stock\page.tsx
import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, Tag, CircleDollarSign, Boxes, AlertTriangle, Wallet, Search, History } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { CATEGORY_LABELS, type ProductCategory } from '@/lib/types'

type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  active: boolean
  stock: number
  minStock?: number | null
  variants?: { id: string; label: string; stock: number; active: boolean }[]
}

type StockMovement = {
  id: string
  delta: number
  type: 'in' | 'out' | 'adjust'
  reason: string | null
  createdAt: string
}

// Umbral general — se usa como default para cualquier producto que no
// tenga su propio "stock mínimo" configurado en Productos.
const LOW_STOCK_THRESHOLD = 10

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ProductCategory] ?? category
}

function getMinStock(p: Product): number {
  return p.minStock ?? LOW_STOCK_THRESHOLD
}

function stockStatus(stock: number, minStock: number): {
  label: string
  dot: string
  badge: string
} {
  if (stock < minStock) {
    return { label: 'Bajo', dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-600 dark:text-red-400' }
  }
  if (stock < minStock * 3) {
    return { label: 'Medio', dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  }
  return { label: 'Bien', dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
}

function getEffectiveStock(p: Product): number {
  if (p.variants && p.variants.length > 0) {
    return p.variants.filter((v) => v.active).reduce((sum, v) => sum + v.stock, 0)
  }
  return typeof p.stock === 'number' ? p.stock : 0
}

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  const status = stockStatus(stock, minStock)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  )
}

// ── Historial de movimientos de un producto ────────────────────────────────
function StockHistoryDialog({
  productId,
  productName,
  onOpenChange,
}: {
  productId: string | null
  productName: string
  onOpenChange: (open: boolean) => void
}) {
  const { data: movements = [], isLoading } = useSWR<StockMovement[]>(
    productId ? `/api/stock?productServiceId=${productId}` : null,
    fetcher
  )

  const TYPE_LABELS: Record<StockMovement['type'], string> = {
    in: 'Entrada',
    out: 'Salida',
    adjust: 'Ajuste',
  }

  return (
    <Dialog open={!!productId} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de stock — {productName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>
        ) : movements.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todavía no hay movimientos registrados para este producto.
          </p>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground">
                    {TYPE_LABELS[m.type]}
                    {m.reason && <span className="ml-1.5 text-muted-foreground">· {m.reason}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                </div>
                <span className={`shrink-0 font-semibold ${m.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.delta > 0 ? '+' : ''}{m.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function StockPage() {
  const { canEdit } = usePermissions()
  const canEditStock = canEdit('stock')

  const { data: products = [], isLoading } = useSWR<Product[]>(
    '/api/products',
    fetcher
  )

  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products]
  )

  // 👇 buscador + filtro de categoría
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categoryOptions = useMemo(() => {
    const set = new Set(activeProducts.map((p) => p.category))
    return Array.from(set)
  }, [activeProducts])

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [activeProducts, searchQuery, categoryFilter])

  const summary = useMemo(() => {
    const totalProducts = activeProducts.length
    const totalStockValue = activeProducts.reduce(
      (acc, p) => acc + (p.price ?? 0) * getEffectiveStock(p),
      0
    )
    const lowStockCount = activeProducts.filter(
      (p) => getEffectiveStock(p) < getMinStock(p)
    ).length

    return { totalProducts, totalStockValue, lowStockCount }
  }, [activeProducts])

  const [draft, setDraft] = useState<Record<string, number>>({})
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [historyProductId, setHistoryProductId] = useState<string | null>(null)

  const getValue = (p: Product) =>
    draft[p.id] ?? getEffectiveStock(p)

  const saveStock = async (p: Product) => {
    setSavingId(p.id)
    try {
      const nextStock = Math.max(0, Number(draft[p.id] ?? p.stock ?? 0) || 0)
      const currentStock = typeof p.stock === 'number' ? p.stock : 0
      const delta = nextStock - currentStock

      if (delta === 0) {
        setSavingId(null)
        return
      }

      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productServiceId: p.id,
          delta,
          reason: reasonDraft[p.id]?.trim() || 'Ajuste manual desde pantalla Stock',
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to update stock')
      }

      await mutate('/api/products')
      await mutate(`/api/stock?productServiceId=${p.id}`)

      setDraft((prev) => {
        const copy = { ...prev }
        delete copy[p.id]
        return copy
      })
      setReasonDraft((prev) => {
        const copy = { ...prev }
        delete copy[p.id]
        return copy
      })
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Error al actualizar stock')
    } finally {
      setSavingId(null)
    }
  }

  const historyProductName = products.find((p) => p.id === historyProductId)?.name ?? ''

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Stock"
        description={
          canEditStock
            ? 'Gestioná las cantidades disponibles por producto/servicio'
            : 'Consultá las cantidades disponibles por producto/servicio'
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {!isLoading && activeProducts.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Boxes className="h-4 w-4" />
                Productos activos
              </div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">
                {summary.totalProducts}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Valor total en stock
              </div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">
                {formatCurrency(summary.totalStockValue)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Stock bajo
              </div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">
                {summary.lowStockCount}
              </p>
            </div>
          </div>
        )}

        {/* buscador + filtro de categoría */}
        {!isLoading && activeProducts.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {categoryOptions.length > 1 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Productos activos</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">
                Cargando...
              </div>
            ) : activeProducts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No hay productos activos
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Ningún producto coincide con esos filtros
              </div>
            ) : (
              <>
                {/* MOBILE: cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {filteredProducts.map((p) => {
                    const effectiveStock = getEffectiveStock(p)
                    const minStock = getMinStock(p)
                    const hasVariants = p.variants && p.variants.length > 0

                    return (
                      <Card key={p.id}>
                        <CardContent className="space-y-4 p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-card-foreground">
                                  {p.name}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <Badge variant="secondary">{categoryLabel(p.category)}</Badge>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Stock actual</p>
                                <p className="font-semibold">{effectiveStock}</p>
                                <div className="mt-1">
                                  <StockBadge stock={effectiveStock} minStock={minStock} />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CircleDollarSign className="h-4 w-4 shrink-0" />
                                  <span>Precio</span>
                                </div>
                                <span className="font-medium">{formatCurrency(p.price)}</span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Package className="h-4 w-4 shrink-0" />
                                  <span>Unidad</span>
                                </div>
                                <span>{p.unit}</span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Tag className="h-4 w-4 shrink-0" />
                                  <span>Categoría</span>
                                </div>
                                <span>{categoryLabel(p.category)}</span>
                              </div>
                            </div>
                          </div>

                          {hasVariants ? (
                            <p className="text-xs text-muted-foreground">
                              {p.variants!.length} variantes — se edita desde &quot;Productos&quot;
                            </p>
                          ) : canEditStock ? (
                            <>
                              <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">
                                  Nuevo stock
                                </label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={getValue(p)}
                                  onChange={(e) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      [p.id]: Math.max(0, Number(e.target.value) || 0),
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">
                                  Motivo (opcional)
                                </label>
                                <Input
                                  placeholder="Ej: compra a proveedor, rotura..."
                                  value={reasonDraft[p.id] ?? ''}
                                  onChange={(e) =>
                                    setReasonDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                                  }
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  onClick={() => saveStock(p)}
                                  disabled={savingId === p.id}
                                >
                                  {savingId === p.id ? 'Guardando…' : 'Guardar'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setHistoryProductId(p.id)}
                                  title="Ver historial"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">Solo lectura</p>
                              <Button variant="outline" size="icon" onClick={() => setHistoryProductId(p.id)} title="Ver historial">
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* DESKTOP/TABLET: table */}
                <div className="hidden md:block">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead className="w-[100px]">Estado</TableHead>
                          <TableHead className="w-[150px]">Stock</TableHead>
                          {canEditStock && <TableHead className="w-[180px]">Motivo</TableHead>}
                          <TableHead className="w-[140px]" />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredProducts.map((p) => {
                          const effectiveStock = getEffectiveStock(p)
                          const minStock = getMinStock(p)
                          const hasVariants = p.variants && p.variants.length > 0

                          return (
                            <TableRow key={p.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell>{categoryLabel(p.category)}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(p.price)}
                              </TableCell>
                              <TableCell>{p.unit}</TableCell>
                              <TableCell>
                                <StockBadge stock={effectiveStock} minStock={minStock} />
                              </TableCell>
                              <TableCell>
                                {hasVariants ? (
                                  <span className="text-xs text-muted-foreground">
                                    {p.variants!.length} variantes — se edita desde &quot;Productos&quot;
                                  </span>
                                ) : canEditStock ? (
                                  <Input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={getValue(p)}
                                    onChange={(e) =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        [p.id]: Math.max(0, Number(e.target.value) || 0),
                                      }))
                                    }
                                  />
                                ) : (
                                  <span className="font-medium">{p.stock ?? 0}</span>
                                )}
                              </TableCell>
                              {canEditStock && (
                                <TableCell>
                                  {!hasVariants && (
                                    <Input
                                      placeholder="Motivo (opcional)"
                                      value={reasonDraft[p.id] ?? ''}
                                      onChange={(e) =>
                                        setReasonDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                                      }
                                    />
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {canEditStock && !hasVariants && (
                                    <Button
                                      onClick={() => saveStock(p)}
                                      disabled={savingId === p.id}
                                    >
                                      {savingId === p.id ? 'Guardando…' : 'Guardar'}
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setHistoryProductId(p.id)}
                                    title="Ver historial de movimientos"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <StockHistoryDialog
        productId={historyProductId}
        productName={historyProductName}
        onOpenChange={(open) => !open && setHistoryProductId(null)}
      />
    </div>
  )
}
