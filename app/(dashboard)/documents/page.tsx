'use client'
//app\(dashboard)\documents\page.tsx
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
import { Receipt, ClipboardList, Truck } from 'lucide-react'
import type { Budget } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'
import { hasFeature } from '@/lib/features'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function DocumentButtons({ budgetId }: { budgetId: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <a href={`/api/budgets/${budgetId}/receipt`} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Receipt className="h-3.5 w-3.5" /> Recibo
        </Button>
      </a>
      <a href={`/api/budgets/${budgetId}/work-order`} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" /> Orden de trabajo
        </Button>
      </a>
      <a href={`/api/budgets/${budgetId}/delivery-note`} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Truck className="h-3.5 w-3.5" /> Remito
        </Button>
      </a>
    </div>
  )
}

export default function DocumentsPage() {
  const { filterBudgets } = usePermissions()
  const { data: budgetsRaw = [], isLoading } = useSWR<Budget[]>('/api/budgets', fetcher)
  const budgets = filterBudgets(budgetsRaw)

  // 🌟 nuevo: feature gate del tenant (mismo patrón que showMetrics en el dashboard)
  const { data: branding, isLoading: isLoadingBranding } = useSWR('/api/tenants', fetcher)
  const hasVouchersFeature = hasFeature({ features: branding?.features }, 'vouchers')

  // 🌟 Mientras no sabemos si tiene el feature, no mostramos nada todavía
  // (evita el flash de contenido que se ve un instante antes de bloquear)
  if (isLoadingBranding) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    )
  }

  // 🌟 Bloqueo si el tenant no tiene el feature — va ANTES y SOLO, no envuelve el resto
  if (!hasVouchersFeature) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Documentos"
          description="Este módulo no está habilitado para tu plan"
        />
        <div className="p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">
                Tu plan actual no incluye la generación de recibos, órdenes de trabajo y remitos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 🌟 Página normal — solo se llega acá si el tenant tiene el feature habilitado
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Documentos"
        description="Generá recibos, órdenes de trabajo y remitos a partir de tus presupuestos"
      />

      <div className="p-4 md:p-6 lg:p-8">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              Cargando presupuestos...
            </CardContent>
          </Card>
        ) : budgets.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              No hay presupuestos todavía
            </CardContent>
          </Card>
        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="space-y-4 md:hidden">
              {budgets.map((b) => (
                <Card key={b.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground">
                          {b.client?.company || b.client?.name || '-'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                    </div>
                    <DocumentButtons budgetId={b.id} />
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
                        <TableHead>Documentos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgets.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono text-xs">
                            #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                          </TableCell>
                          <TableCell>{b.client?.company || b.client?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                          </TableCell>
                          <TableCell>
                            <DocumentButtons budgetId={b.id} />
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