'use client'
//app\(dashboard)\documents\page.tsx
import { useState } from 'react'
import useSWR from 'swr'
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
  AlertCircle,
  Clock,
  Ban,
  Download,
} from 'lucide-react'
import type { Budget, Receipt as ReceiptType } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { usePermissions } from '@/hooks/use-permissions'
import { hasFeature } from '@/lib/features'
import { CreateReceiptModal } from '@/components/documents/create-receipt-modal'
import { ReceiptsHistoryModal } from '@/components/documents/receipts-history-modal'
import { CreateDeliveryNoteModal } from '@/components/documents/create-delivery-note-modal'
import { DeliveryNotesHistoryModal } from '@/components/documents/delivery-notes-history-modal'
import { CreateWorkOrderModal } from '@/components/documents/create-work-order-modal'
import { WorkOrdersHistoryModal } from '@/components/documents/work-orders-history-modal'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

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

// 🌟 Estados de recibo que NO deben sumar al monto cobrado. Se mantiene como
// lista blanca de "inactivos" (en vez de una lista de "activos") para que un
// recibo sin `status` (registros viejos) se siga contando como activo por
// defecto. Incluye sinónimos conocidos para no repetir este bug si en algún
// endpoint se usa una palabra distinta para anular ('voided', 'cancelled',
// 'anulado', etc. son todos el mismo caso de negocio).
const INACTIVE_RECEIPT_STATUSES = new Set([
  'cancelled',
  'anulado',
  'voided',
  'void',
  'annulled',
])

function isReceiptActive(status?: string | null) {
  if (!status) return true
  return !INACTIVE_RECEIPT_STATUSES.has(status)
}

// 🌟 El "Estado de Cobro" (Saldado / Falta $X / Pendiente $X) solo tiene sentido
// para presupuestos que efectivamente se van a facturar. Un Rechazado, Vencido
// o todavía en Borrador no genera una expectativa real de cobro.
const NO_PAYMENT_STATUS_BUDGET_STATUSES = new Set(['draft', 'rejected', 'expired'])

function showsPaymentStatus(status: string) {
  return !NO_PAYMENT_STATUS_BUDGET_STATUSES.has(status)
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

// Componente para ver el Estado del Cobro / Saldo Pendiente
function PaymentStatusBadge({
  total,
  collected,
}: {
  total: number
  collected: number
}) {
  const pending = Math.max(0, total - collected)

  if (collected >= total && total > 0) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 font-medium gap-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Saldado
      </Badge>
    )
  }

  if (collected > 0 && pending > 0) {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 font-medium gap-1 w-fit">
          <Clock className="h-3 w-3 text-amber-600" /> Falta {formatCurrency(pending)}
        </Badge>
        <span className="text-[10px] text-slate-500 font-normal">
          Cobrado: {formatCurrency(collected)}
        </span>
      </div>
    )
  }

  return (
    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 font-medium gap-1">
      <AlertCircle className="h-3 w-3 text-slate-400" /> Pendiente {formatCurrency(pending)}
    </Badge>
  )
}

// Acciones para vista Mobile
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
  alreadyCollected,
  isMobile = false,
}: {
  budget: Budget
  onReceiptCreated: () => void
  alreadyCollected: number
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
        alreadyCollected={alreadyCollected}  // 👈 nuevo
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
  // 👇 default: solo Aprobados + Completados — son los únicos que se
  // gestionan con recibos/OT (a un rechazado o borrador no se le hace
  // recibo). Los demás igual se pueden buscar desde acá con el filtro.
  const [statusFilter, setStatusFilter] = useState<string>('approved_completed')
  const [standaloneReceiptOpen, setStandaloneReceiptOpen] = useState(false) // 👈 nuevo
  const [showVoidedReceipts, setShowVoidedReceipts] = useState(false) //👈 nuevo
  const { filterBudgets } = usePermissions()

  // Obtenemos presupuestos y todos los recibos
  const {
    data: budgetsRaw = [],
    mutate: mutateBudgets,
    isLoading: isLoadingBudgets,
  } = useSWR<Budget[]>('/api/budgets', fetcher)

  const {
    data: receipts = [],
    mutate: mutateReceipts,
    isLoading: isLoadingReceipts,
  } = useSWR<ReceiptType[]>('/api/receipts', fetcher)

  const standaloneReceipts = receipts.filter((r: any) => r.isStandalone)
  const visibleStandaloneReceipts = showVoidedReceipts
    ? standaloneReceipts
    : standaloneReceipts.filter((r: any) => r.status !== 'voided')

  const handleVoidStandaloneReceipt = async (id: string) => {
    if (!confirm('¿Anular este recibo? Esta acción queda registrada y no se puede deshacer. El monto dejará de contarse en tus métricas.')) return
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'voided' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Recibo anulado')
      mutateReceipts()
    } catch {
      toast.error('No se pudo anular el recibo')
    }
  }

  const budgets = filterBudgets(budgetsRaw)

  const { data: branding, isLoading: isLoadingBranding } = useSWR('/api/tenants', fetcher)
  const hasVouchersFeature = hasFeature({ plan: branding?.plan, features: branding?.features }, 'vouchers') // 👈 agregado plan

  // Mapeo seguro de cobrados por cada presupuesto — combina recibos
  // manuales (efectivo/transferencia) y pagos online aprobados (Mercado
  // Pago). Antes solo miraba recibos, así que un presupuesto cobrado por MP
  // aparecía como si nada hubiera entrado.
  const collectedMap: Record<string, number> = {}

  receipts.forEach((r: any) => {
    // Detectamos el ID vengar como venga (budgetId, budget_id o sub-objeto budget.id)
    const bId = r.budgetId ?? r.budget_id ?? r.budget?.id

    // 👇 sourceBudgetPaymentId: es un recibo "espejo" de un pago de MP — la
    // plata que representa ya la sumamos abajo desde b.payments, sumarla
    // acá también la contaría dos veces.
    if (bId !== undefined && bId !== null && isReceiptActive(r.status) && !r.sourceBudgetPaymentId) {
      const key = String(bId)
      const amount = Number(r.amount || 0)
      collectedMap[key] = (collectedMap[key] || 0) + amount
    }
  })

  budgets.forEach((b) => {
    const mpAmount = (b.payments ?? []).reduce((acc, p) => acc + Number(p.amount || 0), 0)
    if (mpAmount > 0) {
      collectedMap[b.id] = (collectedMap[b.id] || 0) + mpAmount
    }
  })

  // Función helper para consultar saldo cobrado seguro por ID de presupuesto
  const getCollectedAmount = (budgetId: string | number) => {
    return collectedMap[String(budgetId)] || 0
  }

  // Filtrado de búsquedas
  const filteredBudgets = budgets.filter((b) => {
    const clientName = (b.client?.company || b.client?.name || '').toLowerCase()
    const budgetNum = String(b.budgetNumber ?? 0)
    const term = search.toLowerCase()
    const matchesSearch = clientName.includes(term) || budgetNum.includes(term)

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'approved_completed'
        ? b.status === 'approved' || b.status === 'completed'
        : b.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // KPIs
  const totalApproved = budgets.filter(
    (b) => b.status === 'approved' || b.status === 'completed'
  )
  const totalAmount = totalApproved.reduce((acc, b) => acc + (b.total || 0), 0)

  // Suma total cobrada: recibos activos (que no sean "espejo" de un pago de
  // MP ya contado abajo) + pagos de Mercado Pago aprobados
  const totalCollectedReceipts = receipts.reduce((acc: number, r: any) => {
    if (isReceiptActive(r.status) && !r.sourceBudgetPaymentId) {
      return acc + Number(r.amount || 0)
    }
    return acc
  }, 0)
  const totalCollectedMp = budgets.reduce(
    (acc, b) => acc + (b.payments ?? []).reduce((a, p) => a + Number(p.amount || 0), 0),
    0
  )
  const totalCollected = totalCollectedReceipts + totalCollectedMp

  const totalPending = Math.max(0, totalAmount - totalCollected)

  const handleDocumentChange = () => {
    mutateBudgets()
    mutateReceipts()
  }

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
      >
        {hasVouchersFeature && (
          <Button
            size="sm"
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            onClick={() => setStandaloneReceiptOpen(true)}
          >
            <Receipt className="h-4 w-4" />
            Recibo sin presupuesto
          </Button>
        )}
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8 pt-0 space-y-6">
        {/* KPI Cards superiores */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Cobrado (recibos + Mercado Pago)</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalCollected)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Saldo por Cobrar</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalPending)}
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
                <p className="text-xs text-slate-500 font-medium">Monto Aprobado Total</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buscador + filtro de estado */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente o N° de presupuesto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-9 text-sm bg-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved_completed">Aprobados y completados</SelectItem>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingBudgets || isLoadingReceipts ? (
          <Card className="border-slate-200">
            <CardContent className="flex items-center justify-center py-16 text-slate-400 text-sm">
              Cargando presupuestos y recibos...
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
            {/* MOBILE */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredBudgets.map((b) => {
                const collected = getCollectedAmount(b.id)
                return (
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(b.total || 0)}
                      </span>
                      {showsPaymentStatus(b.status) ? (
                        <PaymentStatusBadge total={b.total || 0} collected={collected} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                      <DocumentRow
                        budget={b}
                        onReceiptCreated={handleDocumentChange}
                        alreadyCollected={collected} // 👈 nuevo
                        isMobile
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 👇 nuevo — recibos sin presupuesto, listado independiente */}
            {standaloneReceipts.length > 0 && (
              <Card className="border-slate-200 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Recibos sin presupuesto</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No están asociados a ningún presupuesto, pero suman a "Cobrado"
                    </p>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer shrink-0">
                    <Checkbox
                      checked={showVoidedReceipts}
                      onCheckedChange={(checked) => setShowVoidedReceipts(!!checked)}
                    />
                    Mostrar anulados
                  </label>
                </div>

                {visibleStandaloneReceipts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-400">
                    No hay recibos sin presupuesto {showVoidedReceipts ? '' : 'activos'}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {visibleStandaloneReceipts.map((r: any) => {
                    const isVoided = r.status === 'voided'
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {r.client?.company || r.client?.name || 'Sin cliente'}
                          </p>
                          <p className="text-xs text-slate-500">
                            N° S-{String(r.receiptNumber).padStart(6, '0')} · {formatDate(r.issueDate || r.createdAt)}
                            {isVoided && <span className="ml-1.5 text-destructive font-medium">· Anulado</span>}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-sm font-semibold ${isVoided ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {formatCurrency(r.amount)}
                          </span>
                          <a href={`/api/receipts/${r.id}/pdf`} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          {!isVoided && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleVoidStandaloneReceipt(r.id)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              </Card>
            )}


            {/* DESKTOP */}
            <div className="hidden md:block w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="w-[100px] font-semibold text-slate-700">N° Presup.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto Total</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado Presup.</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado de Cobro</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 pr-6">
                      Generar Documentos
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.map((b) => {
                    const collected = getCollectedAmount(b.id)
                    return (
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
                        <TableCell>
                          {showsPaymentStatus(b.status) ? (
                            <PaymentStatusBadge total={b.total || 0} collected={collected} />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-3">
                          <DocumentRow
                            budget={b}
                            onReceiptCreated={handleDocumentChange}
                            alreadyCollected={collected} // 👈 nuevo
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* 👇 nuevo — modal de recibo standalone, vive a nivel de página, no depende de ningún presupuesto */}
      <CreateReceiptModal
        open={standaloneReceiptOpen}
        onOpenChange={setStandaloneReceiptOpen}
        onCreated={() => {
          mutateReceipts()
        }}
      />
    </div>
  )
}