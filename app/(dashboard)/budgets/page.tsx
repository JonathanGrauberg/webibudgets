'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  Loader2, 
  Eye, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  BarChart3,
  Pencil
} from 'lucide-react'
import type { Budget } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'
import { useSession } from 'next-auth/react'

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

export default function BudgetsPage() {
  const { data: session } = useSession()
  const { canEdit, filterBudgets } = usePermissions()
  const canCreateBudget = canEdit('budgets')
  const { data: budgetsRaw = [], isLoading, error } = useSWR<Budget[]>('/api/budgets', fetcher)
  const budgets = filterBudgets(budgetsRaw)

  const [openUpgrade, setOpenUpgrade] = useState(false)

  // 🚨 CALCULADOR DE LÍMITE MENSUAL ESTRICTO
  const limitInfo = useMemo(() => {
    const planKey = (session?.user as any)?.plan || 'starter'
    const isStarter = planKey.toLowerCase() === 'starter'
    const maxBudgets = isStarter ? 30 : 99999

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)

    const currentMonthBudgets = budgetsRaw.filter((b) => {
      if (!b.createdAt) return false
      const budgetDate = new Date(b.createdAt)
      return budgetDate >= startOfMonth
    })

    const count = currentMonthBudgets.length
    const percentage = Math.min(100, (count / maxBudgets) * 100)

    return {
      isStarter,
      isLimitReached: isStarter && count >= maxBudgets,
      isNearLimit: isStarter && count >= 22, // Avisar a partir de 22 presupuestos
      monthlyCount: count,
      maxBudgets,
      percentage
    }
  }, [budgetsRaw, session])

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

  const handleUpgradeRedirect = () => {
    alert("Alcanzaste el límite de 30 presupuestos mensuales de tu plan Starter. Por favor, actualizá tu plan para continuar cotizando.")
    window.location.href = "/settings/team" // O tu ruta de billing/pricing
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <PageHeader
        title="Presupuestos"
        description={
          limitInfo.isStarter
            ? `Listado de presupuestos generados (${limitInfo.monthlyCount}/${limitInfo.maxBudgets} de tu cupo mensual)`
            : "Listado de todos tus presupuestos generados"
        }
      >
        {canCreateBudget && (
          limitInfo.isLimitReached ? (
            <Button 
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md gap-1.5 animate-pulse"
              onClick={handleUpgradeRedirect}
            >
              Expandir plan <ArrowUpRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/budgets/new" className="w-full sm:w-auto">
              <Button id="tour-create-budget" className="w-full sm:w-auto shadow-sm gap-2">
                <Plus className="h-4 w-4" />
                Nuevo presupuesto
              </Button>
            </Link>
          )
        )}
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* 📊 INDICADOR TOP SUPERIOR: Muestra el uso del plan actual de manera elegante */}
        {limitInfo.isStarter && (
          <Card className={`overflow-hidden border shadow-sm ${limitInfo.isLimitReached ? 'border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10' : 'border-slate-200 dark:border-slate-800'}`}>
            <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className={`p-2.5 rounded-xl shrink-0 ${limitInfo.isLimitReached ? 'bg-red-500 text-white' : 'bg-blue-500/10 text-blue-600'}`}>
                  {limitInfo.isLimitReached ? <AlertTriangle className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {limitInfo.isLimitReached ? 'Límite Mensual Alcanzado' : 'Consumo de tu Plan Starter'}
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">Mensual</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    Has utilizado {limitInfo.monthlyCount} de tus {limitInfo.maxBudgets} cotizaciones disponibles para este período.
                  </p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full md:w-72 space-y-1.5 shrink-0">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Progreso de uso</span>
                  <span className={limitInfo.isLimitReached ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                    {Math.round(limitInfo.percentage)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${limitInfo.isLimitReached ? 'bg-red-500' : limitInfo.isNearLimit ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${limitInfo.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONTENEDOR PRINCIPAL */}
        {budgets.length === 0 ? (
          
          /* ✨ EMPTY STATE INTEGRADO: Reemplaza las listas vacías aburridas por una invitación de UX */
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center max-w-md mx-auto space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 dark:text-slate-600">
                <FileText className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-md font-bold text-slate-900 dark:text-slate-50">No hay presupuestos todavía</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {limitInfo.isStarter 
                    ? `Comenzá creando una cotización profesional. Recordá que disponés de hasta ${limitInfo.maxBudgets} presupuestos mensuales en tu plan.`
                    : "Creá cotizaciones completas, personalizadas con tu marca y descargables en PDF en segundos."
                  }
                </p>
              </div>
              {canCreateBudget && (
                limitInfo.isLimitReached ? (
                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100 gap-1" onClick={handleUpgradeRedirect}>
                    <Sparkles className="h-4 w-4" /> Desbloquear más cupos
                  </Button>
                ) : (
                  <Link href="/budgets/new">
                    <Button size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" /> Crear mi primer presupuesto
                    </Button>
                  </Link>
                )
              )}
            </CardContent>
          </Card>

        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="space-y-4 md:hidden">
              {budgets.map((b) => (
                <Card key={b.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground">
                          {b.client?.company || b.client?.name || '-'}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          Presupuesto #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[b.status]}>
                        {STATUS_LABELS[b.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-card-foreground">
                        {formatCurrency(b.total)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/budgets/${b.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </Link>
                      {canCreateBudget && (
                        <Link href={`/budgets/${b.id}/edit`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* DESKTOP/TABLET: table */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgets.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">
                            #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                          </TableCell>
                          <TableCell>
                            {b.client?.company || b.client?.name || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[b.status]}>
                              {STATUS_LABELS[b.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(b.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/budgets/${b.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver
                                </Button>
                              </Link>
                              {canCreateBudget && (
                                <Link href={`/budgets/${b.id}/edit`}>
                                  <Button variant="outline" size="sm">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                </Link>
                              )}
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
    </div>
  )
}