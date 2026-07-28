'use client'
//app\(dashboard)\budgets\page.tsx
import { hasFeature } from '@/lib/features'
import { LockedButton } from '@/components/feature-gate'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { 
  Loader2, Eye, Plus, FileText, Pencil, Search, CheckCircle2, Wallet,
  Percent, TrendingUp, PackageMinus, Handshake, // 👈 nuevo
} from 'lucide-react'
import type { Budget } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'


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

// 🌟 nuevo: fecha corta para la columna de la tabla
function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

// 🌟 Ganancia = Total del presupuesto - costo de los productos que lo componen.
// Ítems "libre" o sin `cost` cargado cuentan como costo $0 (inflan la ganancia mostrada).
function computeBudgetCostMetrics(budget: Budget) {
  let cost = 0
  let hasMissingCost = false

  for (const item of budget.items ?? []) {
    const productCost = (item as any).productService?.cost
    if (productCost != null) {
      cost += productCost * item.quantity
    } else {
      hasMissingCost = true
    }
  }

  const profit = budget.total - cost
  const marginPct = budget.total > 0 ? (profit / budget.total) * 100 : 0

  return { cost, profit, marginPct, hasMissingCost }
}

function summaryTotalForMargin(budgets: Budget[]): number {
  const totalRevenue = budgets.reduce((acc, b) => acc + (b.total ?? 0), 0)
  if (totalRevenue === 0) return 0
  const totalProfit = budgets.reduce((acc, b) => acc + computeBudgetCostMetrics(b).profit, 0)
  return (totalProfit / totalRevenue) * 100
}

export default function BudgetsPage() {
  
  const { canEdit, filterBudgets } = usePermissions()
  const canCreateBudget = canEdit('budgets')
  const { data: budgetsRaw = [], isLoading, error } = useSWR<Budget[]>('/api/budgets', fetcher)
  const budgets = filterBudgets(budgetsRaw)

  const [openUpgrade, setOpenUpgrade] = useState(false)

  // 🌟 nuevo: buscador + filtro de estado
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active')  // 👈 subido acá

  const { data: branding } = useSWR('/api/tenants', fetcher)
  const canEditBudgetsFeature = hasFeature(
    { plan: branding?.plan, features: branding?.features },
    'editBudgets'
  )

  const filteredBudgets = useMemo(() => {
  return budgets.filter((b) => {
    const clientName = (b.client?.company || b.client?.name || '').toLowerCase()
    const budgetNum = String(b.budgetNumber ?? 0).padStart(6, '0')
    const matchesSearch =
      !searchQuery ||
      clientName.includes(searchQuery.toLowerCase()) ||
      budgetNum.includes(searchQuery)

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter

    // 👈 nuevo
    const isActive = b.active !== false
    const matchesActive =
      activeFilter === 'all' ? true : activeFilter === 'active' ? isActive : !isActive

    return matchesSearch && matchesStatus && matchesActive
  })
}, [budgets, searchQuery, statusFilter, activeFilter])

  const canViewFinancials = canEdit('budgets') // 👈 nuevo — mismo criterio que edición: owner/admin/seller

  const summary = useMemo(() => {
    const total = budgets.length
    const approved = budgets.filter((b) => b.status === 'approved')
    const approvedTotal = approved.reduce((acc, b) => acc + (b.total ?? 0), 0)

    // 🌟 nuevo — costo/ganancia/margen agregados sobre TODO lo filtrado, no solo aprobados
    let totalCost = 0
    let totalProfit = 0
    let anyMissingCost = false
    for (const b of budgets) {
      const { cost, profit, hasMissingCost } = computeBudgetCostMetrics(b)
      totalCost += cost
      totalProfit += profit
      if (hasMissingCost) anyMissingCost = true
    }
    const avgMarginPct = summaryTotalForMargin(budgets)

    return {
      total,
      approvedCount: approved.length,
      approvedTotal,
      totalCost,       // 👈 nuevo
      totalProfit,     // 👈 nuevo
      avgMarginPct,    // 👈 nuevo
      anyMissingCost,  // 👈 nuevo
    }
  }, [budgets])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Error cargando presupuestos
      </div>
    )
  }

  

  const handleToggleActive = async (budgetId: string, reactivate: boolean) => {
    if (!confirm(reactivate ? '¿Reactivar este presupuesto?' : '¿Desactivar este presupuesto? Podés reactivarlo cuando quieras.')) return
    try {
      const res = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: reactivate }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar el presupuesto')
      mutate('/api/budgets')
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el presupuesto')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <PageHeader
        title="Presupuestos"
        description="Listado de todos tus presupuestos generados"
      >
        {canCreateBudget && (
          <Link href="/budgets/new" className="w-full sm:w-auto">
            <Button id="tour-create-budget" className="w-full sm:w-auto shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              Nuevo presupuesto
            </Button>
          </Link>
        )}
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">

        {/* 🌟 nuevo: tira de métricas sutil */}
        {budgets.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-card-foreground">{summary.total}</span>
            <span className="text-muted-foreground">presupuestos</span>
          </div>
          <div className="hidden h-3 w-px bg-border sm:block" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-card-foreground">{summary.approvedCount}</span>
            <span className="text-muted-foreground">aprobados</span>
          </div>
          <div className="hidden h-3 w-px bg-border sm:block" />
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-card-foreground">{formatCurrency(summary.approvedTotal)}</span>
            <span className="text-muted-foreground">en aprobados</span>
          </div>

          {canViewFinancials && (
            <>
              <div className="hidden h-3 w-px bg-border sm:block" />
              <div className="flex items-center gap-1.5">
                <PackageMinus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-card-foreground">{formatCurrency(summary.totalCost)}</span>
                <span className="text-muted-foreground">costo total</span>
              </div>
              <div className="hidden h-3 w-px bg-border sm:block" />
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-card-foreground">{formatCurrency(summary.totalProfit)}</span>
                <span className="text-muted-foreground">ganancia total</span>
              </div>
              <div className="hidden h-3 w-px bg-border sm:block" />
              <div className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-card-foreground">{summary.avgMarginPct.toFixed(1)}%</span>
                <span className="text-muted-foreground">margen promedio</span>
                {summary.anyMissingCost && (
                  <span className="ml-1 text-amber-600" title="Algunos ítems no tienen costo cargado — la ganancia real puede ser menor">⚠️</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
        
        {/* 🌟 buscador + filtro de estado (solo si hay presupuestos) */}
{budgets.length > 0 && (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por cliente o número..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>

    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={activeFilter} onValueChange={(v: 'active' | 'inactive' | 'all') => setActiveFilter(v)}>
      <SelectTrigger className="w-full sm:w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Activos</SelectItem>
        <SelectItem value="inactive">Inactivos</SelectItem>
        <SelectItem value="all">Todos</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}

{/* CONTENEDOR PRINCIPAL */}
{budgets.length === 0 ? (
  <Card className="border-dashed border-2 bg-transparent">
    <CardContent className="flex flex-col items-center justify-center py-14 text-center max-w-md mx-auto space-y-4">
      <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 dark:text-slate-600">
        <FileText className="h-10 w-10" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-md font-bold text-slate-900 dark:text-slate-50">No hay presupuestos todavía</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Creá cotizaciones completas, personalizadas con tu marca y descargables en PDF en segundos.
        </p>
      </div>
      {canCreateBudget && (
        <Link href="/budgets/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Crear mi primer presupuesto
          </Button>
        </Link>
      )}
    </CardContent>
  </Card>

        ) : filteredBudgets.length === 0 ? (
          /* 🌟 nuevo: sin resultados por búsqueda/filtro (distinto del empty state real) */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-muted-foreground">
                No se encontraron presupuestos con esos filtros
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="space-y-4 md:hidden">
              {filteredBudgets.map((b) => {
              const { marginPct, hasMissingCost } = computeBudgetCostMetrics(b) // 👈 nuevo

              return (
                <Card key={b.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground">
                          {b.client?.company || b.client?.name || '-'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          #{String(b.budgetNumber ?? 0).padStart(6, '0')} · {formatDate(b.createdAt)}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[b.status]}>
                        {STATUS_LABELS[b.status]}
                      </Badge>
                    </div>

                    {b.seller && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Handshake className="h-3.5 w-3.5" /> Vendedor
                        </span>
                        <span className="text-card-foreground">{b.seller.name} {b.seller.lastName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-card-foreground">
                        {formatCurrency(b.total)}
                      </span>
                    </div>

                    {canViewFinancials && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Margen</span>
                        <span className="inline-flex items-center gap-1">
                          <Badge className={marginPct < 25 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-800'}>
                            {marginPct.toFixed(1)}%
                          </Badge>
                          {hasMissingCost && <span className="text-amber-600 text-xs">⚠️</span>}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/budgets/${b.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </Link>
                      {canCreateBudget && (
                        canEditBudgetsFeature ? (
                          <Link href={`/budgets/${b.id}/edit`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </Link>
                        ) : (
                          <LockedButton feature="editBudgets" className="flex-1">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </LockedButton>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            </div>

            {/* DESKTOP/TABLET: table */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-muted-foreground">N°</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        {canViewFinancials && (
                          <>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Ganancia</TableHead>
                            <TableHead className="text-right">Margen</TableHead>
                          </>
                        )}
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBudgets.map((b) => {
                        const { cost, profit, marginPct, hasMissingCost } = computeBudgetCostMetrics(b)

                        return (
                          <TableRow key={b.id} className="hover:bg-muted/40">
                            <TableCell className="font-medium">
                              {b.client?.company || b.client?.name || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {b.seller ? `${b.seller.name} ${b.seller.lastName}` : '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(b.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[b.status]}>
                                {STATUS_LABELS[b.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(b.total)}
                            </TableCell>

                            {canViewFinancials && (
                              <>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatCurrency(cost)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(profit)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="inline-flex items-center gap-1">
                                    <Badge className={marginPct < 25 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-800'}>
                                      {marginPct.toFixed(1)}%
                                    </Badge>
                                    {hasMissingCost && (
                                      <span title="Algún ítem sin costo cargado" className="text-amber-600 text-xs">⚠️</span>
                                    )}
                                  </span>
                                </TableCell>
                              </>
                            )}

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/budgets/${b.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver
                                  </Button>
                                </Link>
                                {canCreateBudget && (
                                  canEditBudgetsFeature ? (
                                    <Link href={`/budgets/${b.id}/edit`}>
                                      <Button variant="outline" size="sm">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                      </Button>
                                    </Link>
                                  ) : (
                                    <LockedButton feature="editBudgets" size="sm">
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </LockedButton>
                                  )
                                )}
                                {canCreateBudget && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={ b.active === false ? 'text-emerald-600' : 'text-destructive hover:text-destructive'}
                                    onClick={() => handleToggleActive(b.id, b.active === false)}
                                  >
                                    {b.active === false ? 'Reactivar' : 'Desactivar'}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
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
    </div>
  )
}