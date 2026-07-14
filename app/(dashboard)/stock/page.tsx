'use client'
//app\(dashboard)\stock\page.tsx
import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, Tag, CircleDollarSign, Boxes, AlertTriangle, Wallet } from 'lucide-react'
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
}

const LOW_STOCK_THRESHOLD = 10
const MEDIUM_STOCK_THRESHOLD = 30

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

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ProductCategory] ?? category
}

// 👈 nuevo: define el estado visual del stock según el umbral
function stockStatus(stock: number): {
  label: string
  dot: string
  badge: string
} {
  if (stock < LOW_STOCK_THRESHOLD) {
    return { label: 'Bajo', dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-600 dark:text-red-400' }
  }
  if (stock < MEDIUM_STOCK_THRESHOLD) {
    return { label: 'Medio', dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  }
  return { label: 'Bien', dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
}

function StockBadge({ stock }: { stock: number }) {
  const status = stockStatus(stock)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
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

  // 👈 nuevo: métricas de resumen para las cards
  const summary = useMemo(() => {
    const totalProducts = activeProducts.length
    const totalStockValue = activeProducts.reduce(
      (acc, p) => acc + (p.price ?? 0) * (typeof p.stock === 'number' ? p.stock : 0),
      0
    )
    const lowStockCount = activeProducts.filter(
      (p) => (typeof p.stock === 'number' ? p.stock : 0) < LOW_STOCK_THRESHOLD
    ).length

    return { totalProducts, totalStockValue, lowStockCount }
  }, [activeProducts])

  const [draft, setDraft] = useState<Record<string, number>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const getValue = (p: Product) =>
    draft[p.id] ?? (typeof p.stock === 'number' ? p.stock : 0)

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
          reason: 'Ajuste manual desde pantalla Stock',
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to update stock')
      }

      await mutate('/api/products')

      setDraft((prev) => {
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
        {/* 👈 nuevo: cards de resumen */}
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
                Stock bajo (&lt; {LOW_STOCK_THRESHOLD})
              </div>
              <p className="mt-1 text-2xl font-semibold text-card-foreground">
                {summary.lowStockCount}
              </p>
            </div>
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
            ) : (
              <>
                {/* MOBILE: cards */}
                <div className="space-y-4 p-4 md:hidden">
                  {activeProducts.map((p) => (
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
                              <p className="font-semibold">{p.stock ?? 0}</p>
                              <div className="mt-1">
                                <StockBadge stock={typeof p.stock === 'number' ? p.stock : 0} />
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

                        {canEditStock ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">
                                Nuevo stock
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={getValue(p)}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(0, Number(e.target.value) || 0),
                                  }))
                                }
                              />
                            </div>

                            <Button
                              className="w-full"
                              onClick={() => saveStock(p)}
                              disabled={savingId === p.id}
                            >
                              {savingId === p.id ? 'Guardando…' : 'Guardar'}
                            </Button>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Solo lectura</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
                          <TableHead className="w-[180px]">Stock</TableHead>
                          {canEditStock && <TableHead className="w-[140px]" />}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {activeProducts.map((p) => (
                          <TableRow key={p.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{categoryLabel(p.category)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(p.price)}
                            </TableCell>
                            <TableCell>{p.unit}</TableCell>
                            <TableCell>
                              <StockBadge stock={typeof p.stock === 'number' ? p.stock : 0} />
                            </TableCell>
                            <TableCell>
                              {canEditStock ? (
                                <Input
                                  type="number"
                                  min={0}
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
                                <Button
                                  onClick={() => saveStock(p)}
                                  disabled={savingId === p.id}
                                >
                                  {savingId === p.id ? 'Guardando…' : 'Guardar'}
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}