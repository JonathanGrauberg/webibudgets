'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { Users, Package, FileText, CheckCircle, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

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
  revenue: any[]
  statusStats: Record<string, number>
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando dashboard...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Error cargando dashboard
      </div>
    )
  }

  const { stats, recentBudgets } = data ?? {}
  const budgets = recentBudgets ?? []

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Dashboard"
        description="Sistema de gestión de Ecoservicios"
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Clientes"
            value={stats?.totalClients ?? 0}
            icon={Users}
            description="Registrados"
          />
          <StatCard
            title="Servicios"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            description="Activos"
          />
          <StatCard
            title="Presupuestos"
            value={stats?.totalBudgets ?? 0}
            icon={FileText}
            description="Creados"
          />
          <StatCard
            title="Aprobados"
            value={stats?.approvedBudgets ?? 0}
            icon={CheckCircle}
            description="Confirmados"
          />
          <StatCard
            title="Pendientes"
            value={stats?.pendingBudgets ?? 0}
            icon={Clock}
            description="En gestión"
          />
        </div>

        {/* Recent Budgets */}
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
      </div>
    </div>
  )
}
