'use client'
// app\(dashboard)\dashboard\page.tsx
import { Crown } from 'lucide-react'
import { UpgradeModal } from '@/components/feature-gate'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { 
  Users, 
  Package, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  BarChart3,
  LayoutDashboard,
  Wallet
} from 'lucide-react'
import Link from 'next/link'
import { usePermissions } from '@/hooks/use-permissions'
import useSWR from 'swr'
import { hasFeature } from '@/lib/features'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { RevenueBarChart } from '@/components/dashboard/revenue-bar-chart'
import { TopRequestedProducts } from '@/components/dashboard/top-requested-products'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

type DashboardBudget = {
  id: string
  status: keyof typeof STATUS_LABELS
  total: number
  createdAt: string
  client?: {
    name?: string
    company?: string
  }
  items?: {
    id: string
  }[]
}

interface DashboardResponse {
  stats: {
    totalClients: number
    totalProducts: number
    totalBudgets: number
    approvedBudgets: number
    pendingBudgets: number
    rejectedBudgets: number
    totalRevenue: number
  }
  recentBudgets: DashboardBudget[]
  revenue: { month: string; total: number }[]
  statusStats: { status: string; count: number }[]
  topRequestedProducts: {
    productServiceId: string
    name: string
    unit: string
    category: string
    requestCount: number
  }[]
}

function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
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

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function DashboardPage() {
  const { canAccess, filterBudgets, canEdit } = usePermissions()
  const canViewBudgets = canAccess('budgets')
  const canEditBudgets = canEdit('budgets')
  
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Control de colapso de secciones
  const [showRecentBudgets, setShowRecentBudgets] = useState(true)
  const [showMetricsSection, setShowMetricsSection] = useState(true)

  const { data: branding } = useSWR('/api/tenants', fetcher)
  const showMetrics = hasFeature({ plan: branding?.plan, features: branding?.features }, 'dashboardMetrics') // 👈 fix

  const [activeTab, setActiveTab] = useState('overview')       // 👈 nuevo
  const [upgradeOpen, setUpgradeOpen] = useState(false)         // 👈 nuevo

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Error cargando el panel de control
      </div>
    )
  }

  const { stats, recentBudgets } = data
  const budgets = filterBudgets(recentBudgets ?? [])
  const currency = branding?.currency ?? 'ARS'

  // Métricas avanzadas
  const avgTicket =
    (stats?.approvedBudgets ?? 0) > 0
      ? (stats?.totalRevenue ?? 0) / (stats?.approvedBudgets ?? 1)
      : 0

  const approvalRate =
    (stats?.totalBudgets ?? 0) > 0
      ? Math.round(((stats?.approvedBudgets ?? 0) / (stats?.totalBudgets ?? 1)) * 100)
      : 0

  // Cálculo estimado de Pipeline (Suma de los pendientes)
  const pendingBudgetsList = budgets.filter(
  (b) => b.status === 'draft' || b.status === 'sent'
)

const pipelineValue = pendingBudgetsList.reduce((acc, b) => acc + (b.total || 0), 0)

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Dashboard Ejecutivo"
        description="Panel de control e inteligencia comercial de .budgets"
      >
        {canEditBudgets && (
          <div className="flex gap-2">
            <Button asChild size="sm" className="shadow-sm">
              <Link href="/budgets/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Nuevo Presupuesto
              </Link>
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        
        {/* BANNER FINANCIERO DESTACADO (HERO BI) */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/30">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Ingresos Totales Aprobados
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(stats?.totalRevenue ?? 0, currency)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Facturación real confirmada
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/30">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Pipeline en Cotización
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(pipelineValue, currency)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  {stats?.pendingBudgets ?? 0} presupuestos en negociación
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-background to-background border-purple-500/30">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Ratio de Conversión
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {approvalRate}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Ticket Promedio: {formatCurrency(avgTicket, currency)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ORGANIZACIÓN CON PESTAÑAS (TABS) O VISTA COMPLETA */}
        <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (v === 'bi' && !showMetrics) {
            setUpgradeOpen(true)   // 👈 no cambia de tab, abre el modal
            return
          }
          setActiveTab(v)
        }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b pb-2">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Vista General
            </TabsTrigger>

            {/* 👇 ya NO está envuelto en {showMetrics && ...} — siempre se ve */}
            <TabsTrigger value="bi" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Business Intelligence
              {!showMetrics && <Crown className="h-3.5 w-3.5 text-amber-500" />}
            </TabsTrigger>
          </TabsList>
            
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Última actualización: En tiempo real
            </span>
          </div>

          {/* TAB 1: VISTA GENERAL */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* KPI Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title="Clientes"
                value={stats?.totalClients ?? 0}
                icon={Users}
                description="Registrados en base"
                href="/clients"
              />
              <StatCard
                title="Catálogo"
                value={stats?.totalProducts ?? 0}
                icon={Package}
                description="Productos y servicios"
                href="/products"
              />
              <StatCard
                title="Presupuestos"
                value={stats?.totalBudgets ?? 0}
                icon={FileText}
                description="Emitidos en total"
                href="/budgets"
              />
              <StatCard
                title="Aprobados"
                value={stats?.approvedBudgets ?? 0}
                icon={CheckCircle}
                description="Cerrados con éxito"
                href="/budgets"
              />
              <StatCard
                title="Pendientes"
                value={stats?.pendingBudgets ?? 0}
                icon={Clock}
                description="Esperando respuesta"
                href="/budgets"
              />
            </div>

            {/* SECCIÓN COLAPSABLE: Presupuestos Recientes */}
            {canViewBudgets && (
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">
                      Presupuestos Recientes
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {budgets.length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href="/budgets"
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mr-2"
                    >
                      Ver todos
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowRecentBudgets(!showRecentBudgets)}
                    >
                      {showRecentBudgets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {showRecentBudgets && (
                  <CardContent className="pt-0">
                    {budgets.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        No hay presupuestos creados aún.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {budgets.slice(0, 5).map((budget: DashboardBudget) => (
                          <Link
                            key={budget.id}
                            href={`/budgets/${budget.id}`}
                            className="flex items-center justify-between py-3.5 px-2 transition-colors hover:bg-muted/40 rounded-lg group"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {budget.client?.company || budget.client?.name || 'Cliente sin nombre'}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{budget.items?.length || 0} ítems</span>
                                <span>•</span>
                                <span>{formatDate(budget.createdAt)}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <Badge className={STATUS_COLORS[budget.status]}>
                                {STATUS_LABELS[budget.status]}
                              </Badge>
                              <span className="font-semibold text-sm text-foreground w-28 text-right">
                                {formatCurrency(budget.total, currency)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: BUSINESS INTELLIGENCE & MÉTRICAS */}
          {showMetrics && (
            <TabsContent value="bi" className="space-y-6 mt-0">
              {/* ACCORDEÓN O HEADER DE MÉTRICAS */}
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Analítica Avanzada de Ventas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Gráficos comparativos y demanda de productos
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMetricsSection(!showMetricsSection)}
                >
                  {showMetricsSection ? 'Plegar Gráficos' : 'Desplegar Gráficos'}
                </Button>
              </div>

              {showMetricsSection && (
                <>
                  {/* Chips KPI de BI */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4 border-l-4 border-l-emerald-500">
                      <p className="text-xs text-muted-foreground font-medium">Efectividad Comercial</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{approvalRate}%</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Presupuestos ganados vs. emitidos</p>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-blue-500">
                      <p className="text-xs text-muted-foreground font-medium">Ticket Promedio Venta</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {formatCurrency(avgTicket, currency)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">Promedio por presupuesto aprobado</p>
                    </Card>

                    <Card className="p-4 border-l-4 border-l-purple-500">
                      <p className="text-xs text-muted-foreground font-medium">Producto Estrella</p>
                      <p className="mt-1 truncate text-xl font-bold text-foreground">
                        {data.topRequestedProducts?.[0]?.name ?? 'Sin datos'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">El más cotizado en presupuestos</p>
                    </Card>
                  </div>

                  {/* Donut + Barras */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="rounded-xl shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Distribución por Estados</CardTitle>
                        <CardDescription className="text-xs">Estado actual de los presupuestos emitidos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StatusDonut statusStats={data.statusStats ?? []} accentColor={branding?.primaryColor} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Evolución de Ingresos Aprobados</CardTitle>
                        <CardDescription className="text-xs">Facturación mensual consolidada</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RevenueBarChart
                          revenue={data.revenue ?? []}
                          currency={currency}
                          accentColor={branding?.primaryColor}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Más Solicitados */}
                  <Card className="rounded-xl shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Productos y Servicios Más Requeridos</CardTitle>
                      <CardDescription className="text-xs">
                        Frecuencia de aparición en cotizaciones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TopRequestedProducts
                        products={data.topRequestedProducts ?? []}
                        accentColor={branding?.primaryColor}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          )}
        </Tabs>
          <UpgradeModal feature="dashboardMetrics" open={upgradeOpen} onOpenChange={setUpgradeOpen} /> {/* 👈 nuevo */}
      </div>
    </div>
  )
}