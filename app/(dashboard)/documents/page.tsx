'use client'
//app\(dashboard)\documents\page.tsx
import { useState } from 'react'
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Receipt, ClipboardList, Truck, History, Plus, ChevronDown } from 'lucide-react'
import type { Budget } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'
import { hasFeature } from '@/lib/features'
import { CreateReceiptModal } from '@/components/documents/create-receipt-modal'
import { ReceiptsHistoryModal } from '@/components/documents/receipts-history-modal'
import { CreateDeliveryNoteModal } from '@/components/documents/create-delivery-note-modal'
import { DeliveryNotesHistoryModal } from '@/components/documents/delivery-notes-history-modal'
import { CreateWorkOrderModal } from '@/components/documents/create-work-order-modal'
import { WorkOrdersHistoryModal } from '@/components/documents/work-orders-history-modal'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

function DocumentTypeMenu({
  icon: Icon,
  label,
  onNew,
  onHistory,
}: {
  icon: React.ElementType
  label: string
  onNew: () => void
  onHistory: () => void
}) {
  // 👇 diferimos la apertura para que el DropdownMenu termine de cerrarse antes
  const handleNew = () => setTimeout(onNew, 0)
  const handleHistory = () => setTimeout(onHistory, 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleNew} className="gap-2">
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleHistory} className="gap-2">
          <History className="h-3.5 w-3.5" /> Ver historial
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DocumentButtons({ budget, onReceiptCreated }: { budget: Budget; onReceiptCreated: () => void }) {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryHistoryOpen, setDeliveryHistoryOpen] = useState(false)
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false)
  const [workOrderHistoryOpen, setWorkOrderHistoryOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <DocumentTypeMenu
          icon={Receipt}
          label="Recibo"
          onNew={() => setReceiptModalOpen(true)}
          onHistory={() => setHistoryModalOpen(true)}
        />
        <DocumentTypeMenu
          icon={Truck}
          label="Remito"
          onNew={() => setDeliveryModalOpen(true)}
          onHistory={() => setDeliveryHistoryOpen(true)}
        />
        <DocumentTypeMenu
          icon={ClipboardList}
          label="Orden de trabajo"
          onNew={() => setWorkOrderModalOpen(true)}
          onHistory={() => setWorkOrderHistoryOpen(true)}
        />
      </div>

      <CreateReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        budgetId={budget.id}
        budgetTotal={budget.total}
        budgetNumber={budget.budgetNumber ?? 0}
        onCreated={onReceiptCreated}
      />
      <ReceiptsHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        budgetId={budget.id}
        budgetNumber={budget.budgetNumber ?? 0}
      />

      <CreateDeliveryNoteModal
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        budgetId={budget.id}
        budgetNumber={budget.budgetNumber ?? 0}
        onCreated={() => {}}
      />
      <DeliveryNotesHistoryModal
        open={deliveryHistoryOpen}
        onOpenChange={setDeliveryHistoryOpen}
        budgetId={budget.id}
        budgetNumber={budget.budgetNumber ?? 0}
      />

      <CreateWorkOrderModal
        open={workOrderModalOpen}
        onOpenChange={setWorkOrderModalOpen}
        budgetId={budget.id}
        budgetNumber={budget.budgetNumber ?? 0}
        onCreated={() => {}}
      />
      <WorkOrdersHistoryModal
        open={workOrderHistoryOpen}
        onOpenChange={setWorkOrderHistoryOpen}
        budgetId={budget.id}
        budgetNumber={budget.budgetNumber ?? 0}
      />
    </>
  )
}

export default function DocumentsPage() {
  const { filterBudgets } = usePermissions()
  const { data: budgetsRaw = [], isLoading } = useSWR<Budget[]>('/api/budgets', fetcher)
  const budgets = filterBudgets(budgetsRaw)

  const { data: branding, isLoading: isLoadingBranding } = useSWR('/api/tenants', fetcher)
  const hasVouchersFeature = hasFeature({ features: branding?.features }, 'vouchers')

  if (isLoadingBranding) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Cargando...
      </div>
    )
  }

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
                    <DocumentButtons budget={b} onReceiptCreated={() => {}} />
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
                            <DocumentButtons budget={b} onReceiptCreated={() => {}} />
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