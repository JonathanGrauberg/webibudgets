'use client'
//app\(dashboard)\dashboard\page.tsx
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { Users, Package, FileText, CheckCircle, Clock, DollarSign } from 'lucide-react'
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


function formatCurrency(amount: number): string {
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

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function DashboardPage() {
  const { canAccess, filterBudgets } = usePermissions()
  const canViewBudgets = canAccess('budgets')
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // 🌟 Hooks siempre arriba, sin duplicar y sin depender de `data`/`stats`
  // (que todavía pueden ser null en el primer render)
  const { data: branding } = useSWR('/api/tenants', fetcher)
  const showMetrics = hasFeature({ features: branding?.features }, 'dashboardMetrics')

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
        Error cargando dashboard
      </div>
    )
  }

  const { stats, recentBudgets } = data
  const budgets = filterBudgets(recentBudgets ?? [])

  // 🌟 Ahora sí, después de confirmar que `data`/`stats` existen
  const avgTicket =
    (stats?.approvedBudgets ?? 0) > 0
      ? (stats?.totalRevenue ?? 0) / (stats?.approvedBudgets ?? 1)
      : 0

  const approvalRate =
    (stats?.totalBudgets ?? 0) > 0
      ? Math.round(((stats?.approvedBudgets ?? 0) / (stats?.totalBudgets ?? 1)) * 100)
      : 0

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Dashboard"
        description="Sistema de gestión .budgets by Webi."
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Clientes"
            value={stats?.totalClients ?? 0}
            icon={Users}
            description="Registrados"
            href="/clients"
          />
          <StatCard
            title="Servicios"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            description="Activos"
            href="/products"
          />
          <StatCard
            title="Presupuestos"
            value={stats?.totalBudgets ?? 0}
            icon={FileText}
            description="Creados"
            href="/budgets"
          />
          <StatCard
            title="Aprobados"
            value={stats?.approvedBudgets ?? 0}
            icon={CheckCircle}
            description="Confirmados"
            href="/budgets"
          />
          <StatCard
            title="Pendientes"
            value={stats?.pendingBudgets ?? 0}
            icon={Clock}
            description="En gestión"
            href="/budgets"
          />
        </div>

        {canViewBudgets && (
          <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Presupuestos Recientes</CardTitle>
              <Link
                href="/budgets"
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver todos
              </Link>
            </CardHeader>

            <CardContent>
              {budgets.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay presupuestos creados aún
                </p>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget: DashboardBudget) => (
                    <Link
                      key={budget.id}
                      href={`/budgets/${budget.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-card-foreground">
                          {budget.client?.company || budget.client?.name || 'Cliente'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {budget.items?.length || 0} item(s) · {formatDate(budget.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge className={STATUS_COLORS[budget.status]}>
                          {STATUS_LABELS[budget.status]}
                        </Badge>
                        <span className="font-semibold text-card-foreground">
                          {formatCurrency(budget.total)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showMetrics && (
          <div className="mt-10 space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">Métricas avanzadas</h2>
              <span className="text-xs text-muted-foreground">Solo visible para tu plan</span>
            </div>

            {/* Chips de insight */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Tasa de aprobación</p>
                <p className="mt-1 text-2xl font-semibold text-card-foreground">{approvalRate}%</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Ticket promedio aprobado</p>
                <p className="mt-1 text-2xl font-semibold text-card-foreground">
                  {formatCurrency(avgTicket)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Ítem más solicitado</p>
                <p className="mt-1 truncate text-2xl font-semibold text-card-foreground">
                  {data.topRequestedProducts?.[0]?.name ?? '—'}
                </p>
              </div>
            </div>

            {/* Donut + Barras */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Estado de presupuestos</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusDonut statusStats={data.statusStats ?? []} accentColor={branding?.primaryColor} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Ingresos aprobados por mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueBarChart
                    revenue={data.revenue ?? []}
                    currency={branding?.currency ?? 'ARS'}
                    accentColor={branding?.primaryColor}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Más solicitados */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Más solicitados en presupuestos</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Cantidad de presupuestos distintos donde se incluyó cada producto o servicio
                  (no implica que se haya concretado el trabajo)
                </p>
              </CardHeader>
              <CardContent>
                <TopRequestedProducts
                  products={data.topRequestedProducts ?? []}
                  accentColor={branding?.primaryColor}
                />
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}