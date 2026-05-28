'use client'

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
import { Loader2, Eye } from 'lucide-react'
import type { Budget } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'

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
  const { data: budgets = [], isLoading, error } = useSWR<Budget[]>('/api/budgets', fetcher)

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

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Presupuestos"
        description="Listado de presupuestos generados"
      >
        <Link href="/budgets/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Nuevo presupuesto</Button>
        </Link>
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8">
        {/* MOBILE: cards */}
        <div className="space-y-4 md:hidden">
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay presupuestos cargados
              </CardContent>
            </Card>
          ) : (
            budgets.map((b) => (
              <Card key={b.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground">
                        {b.client?.company || b.client?.name || '-'}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        ID: {b.id.slice(0, 8)}
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

                  <Link href={`/budgets/${b.id}`} className="block">
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver presupuesto
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* DESKTOP/TABLET: table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
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
                        {b.id.slice(0, 8)}
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
                        <Link href={`/budgets/${b.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}

                  {budgets.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No hay presupuestos cargados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}