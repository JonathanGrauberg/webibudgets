'use client'

import { Suspense, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Plus, Search, Pencil, Trash2, Tag, CircleDollarSign, Package } from 'lucide-react'
import { ProductForm } from '@/components/product-form'
import useSWR, { mutate } from 'swr'
import type { ProductService, ProductCategory } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'


async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
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

export default function ProductsPage() {
  
  const { data: products = [], isLoading } = useSWR<ProductService[]>('/api/products', fetchProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const handleCreate = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: ProductService) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este producto/servicio?')) return

    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    mutate('/api/products')
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    mutate('/api/products')
  }

  return (
    <Suspense fallback={<Loading />}>
      <TooltipProvider>
        <div className="min-h-screen">
          <PageHeader
            title="Productos y Servicios"
            description="Administra tu catálogo de productos y lista de precios"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agregar un nuevo producto o servicio</TooltipContent>
            </Tooltip>
          </PageHeader>

          <div className="p-4 md:p-6 lg:p-8">
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
            </div>

            {isLoading ? (
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
                      ? 'No se encontraron productos'
                      : 'No hay productos registrados'}
                  </p>

                  {!searchQuery && categoryFilter === 'all' && (
                    <Button variant="link" onClick={handleCreate} className="mt-2">
                      Crear primer producto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* MOBILE: cards */}
                <div className="space-y-4 md:hidden">
                  {filteredProducts.map((product) => (
                    <Card key={product.id}>
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
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CircleDollarSign className="h-4 w-4 shrink-0" />
                              <span>Precio</span>
                            </div>
                            <span className="font-semibold text-card-foreground">
                              {formatCurrency(product.price)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Package className="h-4 w-4 shrink-0" />
                              <span>Unidad</span>
                            </div>
                            <span className="text-card-foreground">
                              {product.unit}
                            </span>
                          </div>

                          {'stock' in product && typeof product.stock === 'number' && (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-4 w-4 shrink-0" />
                                <span>Stock</span>
                              </div>
                              <span className="text-card-foreground">{product.stock}</span>
                            </div>
                          )}
                        </div>

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
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* DESKTOP/TABLET: table */}
                <Card className="hidden md:block">
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                      <Table className="table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[34%]">Producto / Servicio</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium text-card-foreground">
                                    {product.name}
                                  </p>
                                  <p className="line-clamp-2 break-words text-sm text-muted-foreground">
                                    {product.description}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge className={CATEGORY_COLORS[product.category]}>
                                  {CATEGORY_LABELS[product.category]}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-right font-medium">
                                {formatCurrency(product.price)}
                              </TableCell>

                              <TableCell className="text-muted-foreground">
                                {product.unit}
                              </TableCell>

                              <TableCell>
                                <Badge variant={product.active ? 'default' : 'secondary'}>
                                  {product.active ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </TableCell>

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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </DialogTitle>
              </DialogHeader>

              <ProductForm
                product={editingProduct}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </Suspense>
  )
}