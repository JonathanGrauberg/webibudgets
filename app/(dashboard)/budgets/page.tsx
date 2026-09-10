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
  Percent, TrendingUp, PackageMinus, Handshake, ChevronDown, Check, StickyNote,
  Bell,
} from 'lucide-react'
import type { Budget, BudgetStatus } from '@/lib/types'
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

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

type DateFilterPreset = 'all' | 'today' | 'month' | 'year' | 'custom'

// Calcula el rango [desde, hasta] según el preset elegido. null = sin filtro (todas las fechas).
function getDateRange(
  preset: DateFilterPreset,
  customFrom: string,
  customTo: string
): [Date, Date] | null {
  const now = new Date()

  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return [start, end]
  }
  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return [start, end]
  }
  if (preset === 'year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    return [start, end]
  }
  if (preset === 'custom') {
    if (!customFrom && !customTo) return null
    const start = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(0)
    const end = customTo ? new Date(`${customTo}T23:59:59`) : new Date(8640000000000000)
    return [start, end]
  }
  return null
}

// 🌟 Ganancia = Total del presupuesto - costo de los productos que lo componen.
// Ítems "libre" o sin `cost` cargado cuentan como costo $0 (inflan la ganancia mostrada).
function computeBudgetCostMetrics(budget: Budget) {
  let cost = 0
  let hasMissingCost = false

  for (const item of budget.items ?? []) {
    // 👇 antes: solo (item as any).productService?.cost
    // Ahora: prioriza el costo propio del ítem (el que cargaste a mano en los on-the-fly),
    // y si no tiene, recién ahí cae al costo del producto de catálogo vinculado.
    const itemCost = (item as any).cost ?? (item as any).productService?.cost
    if (itemCost != null) {
      cost += itemCost * item.quantity
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

// ─────────────────────────────────────────────────────────────
// Dropdown chico y reusable para las métricas de la tira de arriba
// ─────────────────────────────────────────────────────────────
function MetricDropdown<T extends string>({
  icon: Icon,
  value,
  label,
  options,
  current,
  onChange,
  warning,
}: {
  icon: React.ElementType
  value: string
  label: string
  options: { value: T; label: string }[]
  current: T
  onChange: (v: T) => void
  warning?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted/70"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-semibold text-card-foreground">{value}</span>
        <span className="text-muted-foreground">{label}</span>
        {warning && (
          <span className="text-amber-600" title="Algunos ítems no tienen costo cargado — la ganancia real puede ser menor">
            ⚠️
          </span>
        )}
        <ChevronDown className={`h-3 w-3 text-muted-foreground/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-border bg-card p-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-muted ${
                  current === opt.value ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {opt.label}
                {current === opt.value && <Check className="h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 👇 nuevo — ícono con popover para ver la nota completa sin ensuciar la tabla
// ─────────────────────────────────────────────────────────────
function NotesPreview({ notes }: { notes?: string | null }) {
  const [open, setOpen] = useState(false)

  if (!notes || !notes.trim()) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
        title="Ver nota"
      >
        <StickyNote className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-64 whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-left text-xs leading-relaxed text-card-foreground shadow-lg">
            {notes}
          </div>
        </>
      )}
    </div>
  )
}

export default function BudgetsPage() {

  const { canEdit, filterBudgets } = usePermissions()
  const canCreateBudget = canEdit('budgets')
  const { data: budgetsRaw = [], isLoading, error } = useSWR<Budget[]>('/api/budgets', fetcher)
  const budgets = filterBudgets(budgetsRaw)

  const [openUpgrade, setOpenUpgrade] = useState(false)

  // buscador + filtro de estado (para la tabla)
  const [searchQuery, setSearchQuery] = useState('')
  // 👇 default: mostramos todos los estados — el cliente prefirió esto a
  // que arranque filtrado. El filtro "Aprobados y completados" sigue
  // disponible en el dropdown, solo que ya no es la vista inicial.
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active')

  // 👇 filtro por fecha (de creación del presupuesto)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'year' | 'custom'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sellerFilter, setSellerFilter] = useState<string>('all')

  // 👇 alcance de cada métrica de la tira de arriba, independiente de los filtros de la tabla
  const [presupuestosScope, setPresupuestosScope] = useState<'all' | 'active' | 'inactive'>('all')
  const [financeScope, setFinanceScope] = useState<BudgetStatus | 'all'>('approved') // 👈 default: solo aprobados, no todo lo cotizado

  const { data: branding } = useSWR('/api/tenants', fetcher)
  const canEditBudgetsFeature = hasFeature(
    { plan: branding?.plan, features: branding?.features },
    'editBudgets'
  )

  const dateRange = useMemo(
    () => getDateRange(dateFilter, customFrom, customTo),
    [dateFilter, customFrom, customTo]
  )

  // 👇 opciones del filtro de vendedor — solo los que realmente tienen
  // algún presupuesto (no todos los vendedores del tenant), evitando
  // opciones vacías en el dropdown
  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of budgets) {
      if (b.seller) map.set(b.seller.id, `${b.seller.name} ${b.seller.lastName}`.trim())
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [budgets])

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const clientName = (b.client?.company || b.client?.name || '').toLowerCase()
      const budgetNum = String(b.budgetNumber ?? 0).padStart(6, '0')
      const sellerName = b.seller ? `${b.seller.name} ${b.seller.lastName}`.toLowerCase() : ''
      const matchesSearch =
        !searchQuery ||
        clientName.includes(searchQuery.toLowerCase()) ||
        budgetNum.includes(searchQuery) ||
        sellerName.includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'approved_completed'
          ? b.status === 'approved' || b.status === 'completed'
          : b.status === statusFilter

      const isActive = b.active !== false
      const matchesActive =
        activeFilter === 'all' ? true : activeFilter === 'active' ? isActive : !isActive

      const matchesDate =
        !dateRange || (() => {
          const created = new Date(b.createdAt)
          return created >= dateRange[0] && created <= dateRange[1]
        })()

      const matchesSeller =
        sellerFilter === 'all'
          ? true
          : sellerFilter === 'none'
          ? !b.seller
          : b.seller?.id === sellerFilter

      return matchesSearch && matchesStatus && matchesActive && matchesDate && matchesSeller
    })
  }, [budgets, searchQuery, statusFilter, activeFilter, dateRange, sellerFilter])

  const canViewFinancials = canEdit('budgets')

  // 👇 conteo de "presupuestos" según el alcance elegido en su propio dropdown
  const presupuestosSummary = useMemo(() => {
    const activeCount = budgets.filter((b) => b.active !== false).length
    const inactiveCount = budgets.length - activeCount
    const shown =
      presupuestosScope === 'all' ? budgets.length : presupuestosScope === 'active' ? activeCount : inactiveCount
    return { shown, activeCount, inactiveCount, total: budgets.length }
  }, [budgets, presupuestosScope])

  // 👇 costo/ganancia/margen recalculados según el estado elegido (default: solo Aprobados)
  const financeBudgets = useMemo(() => {
    if (financeScope === 'all') return budgets
    return budgets.filter((b) => b.status === financeScope)
  }, [budgets, financeScope])

  const financeSummary = useMemo(() => {
    let totalCost = 0
    let totalProfit = 0
    let anyMissingCost = false
    for (const b of financeBudgets) {
      const { cost, profit, hasMissingCost } = computeBudgetCostMetrics(b)
      totalCost += cost
      totalProfit += profit
      if (hasMissingCost) anyMissingCost = true
    }
    const avgMarginPct = summaryTotalForMargin(financeBudgets)
    return { totalCost, totalProfit, avgMarginPct, anyMissingCost }
  }, [financeBudgets])

  const summary = useMemo(() => {
    const total = budgets.length
    const approved = budgets.filter((b) => b.status === 'approved')
    const approvedTotal = approved.reduce((acc, b) => acc + (b.total ?? 0), 0)
    return { total, approvedCount: approved.length, approvedTotal }
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

  // 👇 nuevo — aviso + acción rápida cuando entró plata por Mercado Pago
  // y todavía no se generó el recibo "espejo" para esos pagos.
  const hasUnreceiptedPayment = (b: Budget) => (b.payments ?? []).some((p) => !p.receipt)

  const handleCreatePaymentReceipts = async (b: Budget) => {
    const pending = (b.payments ?? []).filter((p) => !p.receipt)
    if (pending.length === 0) return
    if (!confirm(`¿Generar recibo por ${pending.length} pago${pending.length > 1 ? 's' : ''} de Mercado Pago recibido${pending.length > 1 ? 's' : ''}?`)) return
    try {
      const results = await Promise.all(
        pending.map((p) => fetch(`/api/budget-payments/${p.id}/create-receipt`, { method: 'POST' }))
      )
      if (results.some((r) => !r.ok)) throw new Error('No se pudo crear alguno de los recibos')
      mutate('/api/budgets')
      mutate('/api/receipts')
    } catch (err) {
      console.error(err)
      alert('No se pudo crear el recibo')
    }
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

  const financeScopeOptions: { value: BudgetStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos los estados' },
    ...(Object.entries(STATUS_LABELS) as [BudgetStatus, string][]).map(([value, label]) => ({ value, label })),
  ]

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

        {/* Tira de métricas — algunas son desplegables ahora */}
        {budgets.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs">

            {/* dropdown: total / activos / inactivos */}
            <MetricDropdown
              icon={FileText}
              value={String(presupuestosSummary.shown)}
              label={
                presupuestosScope === 'all' ? 'presupuestos (todos)'
                : presupuestosScope === 'active' ? 'presupuestos activos'
                : 'presupuestos inactivos'
              }
              current={presupuestosScope}
              onChange={setPresupuestosScope}
              options={[
                { value: 'all', label: `Todos (${presupuestosSummary.total})` },
                { value: 'active', label: `Activos (${presupuestosSummary.activeCount})` },
                { value: 'inactive', label: `Inactivos (${presupuestosSummary.inactiveCount})` },
              ]}
            />

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
                {/* un solo dropdown controla costo + ganancia + margen a la vez */}
                <MetricDropdown
                  icon={PackageMinus}
                  value={formatCurrency(financeSummary.totalCost)}
                  label={`costo (${STATUS_LABELS[financeScope as BudgetStatus] ?? 'todos'})`}
                  current={financeScope}
                  onChange={setFinanceScope}
                  options={financeScopeOptions}
                />
                <div className="hidden h-3 w-px bg-border sm:block" />
                <MetricDropdown
                  icon={TrendingUp}
                  value={formatCurrency(financeSummary.totalProfit)}
                  label={`ganancia (${STATUS_LABELS[financeScope as BudgetStatus] ?? 'todos'})`}
                  current={financeScope}
                  onChange={setFinanceScope}
                  options={financeScopeOptions}
                />
                <div className="hidden h-3 w-px bg-border sm:block" />
                <MetricDropdown
                  icon={Percent}
                  value={`${financeSummary.avgMarginPct.toFixed(1)}%`}
                  label={`margen (${STATUS_LABELS[financeScope as BudgetStatus] ?? 'todos'})`}
                  current={financeScope}
                  onChange={setFinanceScope}
                  options={financeScopeOptions}
                  warning={financeSummary.anyMissingCost}
                />
              </>
            )}
          </div>
        )}

        {/* buscador + filtros (solo si hay presupuestos) */}
        {budgets.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, vendedor o número..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {sellerOptions.length > 0 && (
                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los vendedores</SelectItem>
                    <SelectItem value="none">Sin vendedor</SelectItem>
                    {sellerOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="approved_completed">Aprobados y completados</SelectItem>
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

              <Select
                value={dateFilter}
                onValueChange={(v: DateFilterPreset) => {
                  setDateFilter(v)
                  if (v !== 'custom') { setCustomFrom(''); setCustomTo('') }
                }}
              >
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Este día</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Desde</span>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full sm:w-[170px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Hasta</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full sm:w-[170px]"
                  />
                </div>
              </div>
            )}
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
                const { marginPct, hasMissingCost } = computeBudgetCostMetrics(b)

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
                        <span className="flex items-center gap-1.5 font-semibold text-card-foreground">
                          {formatCurrency(b.total)}
                          {hasUnreceiptedPayment(b) && (
                            <button
                              type="button"
                              title="Entró un pago por Mercado Pago — click para generar el recibo"
                              onClick={() => handleCreatePaymentReceipts(b)}
                              className="text-amber-500 transition hover:text-amber-600"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                          )}
                        </span>
                      </div>

                      {/* 👇 nuevo — nota del presupuesto, solo si tiene algo cargado */}
                      {b.notes && b.notes.trim() && (
                        <div className="rounded-md bg-muted/40 p-2.5 text-xs">
                          <p className="mb-1 flex items-center gap-1.5 font-medium text-card-foreground">
                            <StickyNote className="h-3.5 w-3.5" /> Notas
                          </p>
                          <p className="text-muted-foreground">{b.notes}</p>
                        </div>
                      )}

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
                        <TableHead>Notas</TableHead>
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
                            <TableCell>
                              {/* 👇 nuevo */}
                              <NotesPreview notes={b.notes} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <div className="flex items-center justify-end gap-1.5">
                                {formatCurrency(b.total)}
                                {hasUnreceiptedPayment(b) && (
                                  <button
                                    type="button"
                                    title="Entró un pago por Mercado Pago — click para generar el recibo"
                                    onClick={() => handleCreatePaymentReceipts(b)}
                                    className="text-amber-500 transition hover:text-amber-600"
                                  >
                                    <Bell className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
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
                                    className={b.active === false ? 'text-emerald-600' : 'text-destructive hover:text-destructive'}
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