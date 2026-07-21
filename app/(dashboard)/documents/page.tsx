'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import {
  Receipt,
  ClipboardList,
  Truck,
  History,
  Plus,
  MoreHorizontal,
  Search,
  FileText,
  DollarSign,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateString?: Date | string) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Botón de acción directo con dropdown secundario para historial
function DirectDocButton({
  label,
  icon: Icon,
  onNew,
  onHistory,
  variant = 'outline',
}: {
  label: string
  icon: React.ElementType
  onNew: () => void
  onHistory: () => void
  variant?: 'outline' | 'default' | 'secondary'
}) {
  const defer = (fn: () => void) => () => setTimeout(fn, 0)

  return (
    <div className="inline-flex rounded-md shadow-xs">
      <Button
        variant={variant}
        size="sm"
        onClick={onNew}
        className="h-8 rounded-r-none border-r-0 px-2.5 text-xs font-medium gap-1.5"
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size="sm"
            className="h-8 rounded-l-none px-1.5"
            title="Opciones e historial"
          >
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={defer(onNew)} className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5 text-emerald-600" /> Crear {label}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={defer(onHistory)} className="gap-2 text-xs">
            <History className="h-3.5 w-3.5 text-slate-500" /> Ver Historial
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Acciones para vista Mobile (Tres Puntos)
function MobileActionsMenu({
  onNewReceipt,
  onHistoryReceipt,
  onNewDelivery,
  onHistoryDelivery,
  onNewWorkOrder,
  onHistoryWorkOrder,
}: {
  onNewReceipt: () => void
  onHistoryReceipt: () => void
  onNewDelivery: () => void
  onHistoryDelivery: () => void
  onNewWorkOrder: () => void
  onHistoryWorkOrder: () => void
}) {
  const defer = (fn: () => void) => () => setTimeout(fn, 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
          Documentar <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={defer(onNewReceipt)} className="gap-2 text-xs">
          <Receipt className="h-3.5 w-3.5 text-emerald-600" /> Nuevo Recibo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={defer(onNewDelivery)} className="gap-2 text-xs">
          <Truck className="h-3.5 w-3.5 text-blue-600" /> Nuevo Remito
        </DropdownMenuItem>
        <DropdownMenuItem onClick={defer(onNewWorkOrder)} className="gap-2 text-xs">
          <ClipboardList className="h-3.5 w-3.5 text-amber-600" /> Nueva Órden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DocumentRow({
  budget,
  onReceiptCreated,
  isMobile = false,
}: {
  budget: Budget
  onReceiptCreated: () => void
  isMobile?: boolean
}) {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryHistoryOpen, setDeliveryHistoryOpen] = useState(false)
  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false)
  const [workOrderHistoryOpen, setWorkOrderHistoryOpen] = useState(false)

  return (
    <>
      {isMobile ? (
        <MobileActionsMenu
          onNewReceipt={() => setReceiptModalOpen(true)}
          onHistoryReceipt={() => setHistoryModalOpen(true)}
          onNewDelivery={() => setDeliveryModalOpen(true)}
          onHistoryDelivery={() => setDeliveryHistoryOpen(true)}
          onNewWorkOrder={() => setWorkOrderModalOpen(true)}
          onHistoryWorkOrder={() => setWorkOrderHistoryOpen(true)}
        />
      ) : (
        <div className="flex items-center justify-end gap-2">
          <DirectDocButton
            label="Recibo"
            icon={Receipt}
            onNew={() => setReceiptModalOpen(true)}
            onHistory={() => setHistoryModalOpen(true)}
          />
          <DirectDocButton
            label="Remito"
            icon={Truck}
            onNew={() => setDeliveryModalOpen(true)}
            onHistory={() => setDeliveryHistoryOpen(true)}
          />
          <DirectDocButton
            label="Órden"
            icon={ClipboardList}
            onNew={() => setWorkOrderModalOpen(true)}
            onHistory={() => setWorkOrderHistoryOpen(true)}
          />
        </div>
      )}

      {/* Modales */}
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
  const [search, setSearch] = useState('')
  const { filterBudgets } = usePermissions()
  const { data: budgetsRaw = [], isLoading } = useSWR<Budget[]>('/api/budgets', fetcher)
  const budgets = filterBudgets(budgetsRaw)

  const { data: branding, isLoading: isLoadingBranding } = useSWR('/api/tenants', fetcher)
  const hasVouchersFeature = hasFeature({ features: branding?.features }, 'vouchers')

  // Filtrado de búsquedas
  const filteredBudgets = budgets.filter((b) => {
    const clientName = (b.client?.company || b.client?.name || '').toLowerCase()
    const budgetNum = String(b.budgetNumber ?? 0)
    const term = search.toLowerCase()
    return clientName.includes(term) || budgetNum.includes(term)
  })

  // KPIs Financieros y de Métricas Rápidas
  const totalApprovedAndCompleted = budgets.filter(
    (b) => b.status === 'approved' || b.status === 'completed'
  )
  const totalAmount = totalApprovedAndCompleted.reduce((acc, b) => acc + (b.total || 0), 0)

  if (isLoadingBranding) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
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
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm max-w-sm">
                Tu plan actual no incluye la generación de recibos, órdenes de trabajo y remitos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6">
      <PageHeader
        title="Gestión de Documentos"
        description="Generá recibos de cobro, remitos de entrega y órdenes de trabajo para tus clientes"
      />

      <div className="p-4 md:p-6 lg:p-8 pt-0 space-y-6">
        {/* KPI Cards superiores para enriquecer la pantalla */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Presupuestos Aprobados</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {totalApprovedAndCompleted.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Monto Total Aprobado</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Presupuestos Totales</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{budgets.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buscador */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente o N° de presupuesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <Card className="border-slate-200">
            <CardContent className="flex items-center justify-center py-16 text-slate-400 text-sm">
              Cargando presupuestos...
            </CardContent>
          </Card>
        ) : filteredBudgets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400 text-sm">
              <FileText className="h-8 w-8 opacity-30" />
              <span>No se encontraron presupuestos</span>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            {/* MOBILE: Tarjetas limpias */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredBudgets.map((b) => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-500">
                        #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm mt-0.5">
                        {b.client?.company || b.client?.name || '-'}
                      </h4>
                    </div>
                    <Badge className={STATUS_COLORS[b.status]}>
                      {STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(b.total || 0)}
                    </span>
                    <DocumentRow budget={b} onReceiptCreated={() => {}} isMobile />
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP: Tabla directa y clara */}
            <div className="hidden md:block w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="w-[110px] font-semibold text-slate-700">N° Presup.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto Total</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 pr-6">
                      Generar Documentos
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.map((b) => (
                    <TableRow key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-xs font-semibold text-slate-500">
                        #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {b.client?.company || b.client?.name || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(b.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">
                        {formatCurrency(b.total || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[b.status]}>
                          {STATUS_LABELS[b.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-3">
                        <DocumentRow budget={b} onReceiptCreated={() => {}} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}