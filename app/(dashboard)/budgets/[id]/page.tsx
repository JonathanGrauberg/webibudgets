'use client'

// app/(dashboard)/budgets/[id]/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowLeft,
  Download,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Wrench,
  MessageCircle,
} from 'lucide-react'
import useSWR, { mutate } from 'swr'
import type { Budget, BudgetItem, BudgetStatus } from '@/lib/types'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
} from '@/lib/types'

import { AccessDenied } from '@/components/access-denied'
import { usePermissions } from '@/hooks/use-permissions'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { toast } from 'sonner'
import { buildWhatsappLink } from '@/lib/whatsapp'

async function fetcher(url: string) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Response is not JSON')
  }

  return res.json()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// 👈 nuevo: nombre a mostrar, sea ítem de catálogo o personalizado
function getItemDisplayName(item: BudgetItem): string {
  return item.productService?.name ?? item.customName ?? 'Ítem personalizado'
}

// 👈 nuevo: texto de medidas (ancho x alto + m² + horas), solo si hay algo cargado
function getItemMeasurementsLabel(item: BudgetItem): string | null {
  const parts: string[] = []
  if (item.widthCm && item.heightCm) {
    parts.push(`${item.widthCm}cm x ${item.heightCm}cm`)
    if (item.calculatedM2) parts.push(`${item.calculatedM2} m²`)
  }
  if (item.hours) parts.push(`${item.hours} hs`)
  return parts.length > 0 ? parts.join(' · ') : null
}

type StockProblem = {
  productServiceId: string
  name: string
  requested: number
  available: number
  missing: number
}

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { canViewBudgetStatus, canChangeBudgetStatus } = usePermissions()
  const id = params?.id as string | undefined

  const isValidId = typeof id === 'string' && id !== 'pdf' && id.length > 10

  const { data: budget, isLoading, error } = useSWR<Budget>(
    isValidId ? `/api/budgets/${id}` : null,
    fetcher
  )

  const [isUpdating, setIsUpdating] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockProblems, setStockProblems] = useState<StockProblem[]>([])

  const hasStockProblems = stockProblems.length > 0

  // 👇 nuevo — configuración de seña + link de cobro online (Mercado Pago)
  const [depositEnabled, setDepositEnabled] = useState(false)
  const [depositType, setDepositType] = useState<'percent' | 'fixed'>('percent')
  const [depositValue, setDepositValue] = useState('50')
  const [isSavingDeposit, setIsSavingDeposit] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [depositHydrated, setDepositHydrated] = useState(false)

  useEffect(() => {
    if (!budget || depositHydrated) return
    setDepositHydrated(true)
    setDepositEnabled(!!budget.depositEnabled)
    setDepositType(budget.depositType === 'fixed' ? 'fixed' : 'percent')
    setDepositValue(budget.depositValue != null ? String(budget.depositValue) : '50')
  }, [budget, depositHydrated])

  const saveDepositConfig = async (overrides?: { depositEnabled?: boolean }) => {
    if (!isValidId) return
    setIsSavingDeposit(true)
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositEnabled: overrides?.depositEnabled ?? depositEnabled,
          depositType,
          depositValue: Number(depositValue) || null,
        }),
      })
      if (!res.ok) {
        toast.error('No se pudo guardar la configuración de seña')
        return
      }
      mutate(`/api/budgets/${id}`)
    } finally {
      setIsSavingDeposit(false)
    }
  }

  const ensurePaymentLinkUrl = async (): Promise<string | null> => {
    if (!isValidId) return null
    const res = await fetch(`/api/budgets/${id}/payment-link`, { method: 'POST' })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.url) return null
    mutate(`/api/budgets/${id}`)
    return json.url as string
  }

  const handleCopyPaymentLink = async () => {
    setIsGeneratingLink(true)
    try {
      const url = await ensurePaymentLinkUrl()
      if (!url) {
        toast.error('No se pudo generar el link')
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado — ya lo podés mandar a tu cliente')
    } catch {
      toast.error('No se pudo copiar el link')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false)

  const handleSendWhatsapp = async (whatsappNumber: string, clientName: string, budgetNumberLabel: string) => {
    setIsSendingWhatsapp(true)
    try {
      const url = await ensurePaymentLinkUrl()
      const message = url
        ? `Hola ${clientName}! Te comparto el presupuesto N° ${budgetNumberLabel}: ${url}`
        : `Hola ${clientName}! Te escribo por el presupuesto N° ${budgetNumberLabel}. ¿Pudiste revisarlo?`
      window.open(buildWhatsappLink(whatsappNumber, message), '_blank', 'noopener,noreferrer')
    } finally {
      setIsSendingWhatsapp(false)
    }
  }

  const postStatus = async (newStatus: BudgetStatus, confirmStock = false) => {
    if (!isValidId) return { ok: false, status: 0 as number, json: null as any }

    const res = await fetch(`/api/budgets/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, confirmStock }),
    })

    const json = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, json }
  }

  const handleStatusChange = async (newStatus: BudgetStatus) => {
    if (!isValidId) return

    setIsUpdating(true)
    try {
      const result = await postStatus(newStatus, false)

      if (newStatus === 'approved' && result.status === 409) {
        const problems: StockProblem[] = Array.isArray(result.json?.problems)
          ? result.json.problems
          : []

        setStockProblems(problems)
        setStockModalOpen(true)
        return
      } 

      if (!result.ok) {
        toast.error(
          result.json?.error ?? 'No se pudo actualizar el estado'
        )
        return
      } 

      toast.success('Estado actualizado')

      mutate(`/api/budgets/${id}`)
    } catch (err) {
      console.error('Error updating status:', err)

        toast.error(
          'Ocurrió un error al actualizar el estado'
        )
      } finally {
      setIsUpdating(false)
    }
  }

  const approveAnyway = async () => {
    if (!isValidId) return

    setIsUpdating(true)
    try {
      const result = await postStatus('approved', true)
      if (!result.ok) {
        console.error('Error approving anyway:', result.json)
        toast.error(
          result.json?.error ?? 'No se pudo aprobar el presupuesto'
        )
        return
      }

      setStockModalOpen(false)
      setStockProblems([])

      toast.success(
        'Presupuesto aprobado'
      )

      mutate(`/api/budgets/${id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

const handleGeneratePDF = async () => {
  if (!isValidId) return

  setIsGeneratingPDF(true)

  try {
    const res = await fetch(`/api/budgets/${id}/pdf`)

    if (!res.ok) {
      throw new Error("Error generando PDF")
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)

    // 👇 Obtener nombre real desde headers
    const contentDisposition = res.headers.get("Content-Disposition")

    let fileName = "presupuesto.pdf"

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match?.[1]) {
        fileName = match[1]
      }
    }

    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()

    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Error descargando PDF:", err)
  } finally {
    setIsGeneratingPDF(false)
  }
}
  if (!isValidId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Presupuesto inválido</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando presupuesto...</p>
      </div>
    )
  }

  if (error || !budget) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Presupuesto no encontrado</p>
        <Link href="/budgets">
          <Button variant="outline">Volver a presupuestos</Button>
        </Link>
      </div>
    )
  }

  if (!canViewBudgetStatus(budget.status)) {
    return (
      <AccessDenied message="No tienes permisos para ver este presupuesto." />
    )
  }

  const canChangeStatus = canChangeBudgetStatus()

  const discount = Number(budget.discount ?? 0)
  const tax = Number(budget.tax ?? 0)
  const shippingCost =
    budget.shippingCost === null || budget.shippingCost === undefined
      ? null
      : Number(budget.shippingCost)

  const budgetNumber = String(
      budget.budgetNumber ?? 0
      ).padStart(6, '0')

  const whatsappNumber = (budget?.client as any)?.whatsappNumber as string | undefined

  return (
  <TooltipProvider>
    <div className="min-h-screen">
      <PageHeader
        title={`Presupuesto #${budgetNumber}`}
        description={`Creado el ${formatDate(budget.createdAt)}`}
      >

        {whatsappNumber && budget.client && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={isSendingWhatsapp}
                onClick={() => handleSendWhatsapp(whatsappNumber, budget.client!.name, budgetNumber)}
                className="w-full sm:w-auto gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <MessageCircle className="h-4 w-4" />
                {isSendingWhatsapp ? 'Generando link...' : 'WhatsApp'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Manda el link del presupuesto (con opción de pago si está activada) por WhatsApp
            </TooltipContent>
          </Tooltip>
        )}

        
        <Link href="/budgets" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generar y descargar PDF del presupuesto</TooltipContent>
        </Tooltip>
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {/* MAIN */}
          <div className="space-y-4 md:space-y-6 lg:col-span-2">
            {/* Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {budget.client ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-base font-semibold sm:text-lg">{budget.client.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span>{budget.client.company || 'Sin empresa'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="break-all">{budget.client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{budget.client.phone}</span>
                      </div>
                      {budget.client.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{budget.client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Cliente no encontrado</p>
                )}
              </CardContent>
            </Card>

            {/* Datos comerciales / operativos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Asignaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 shrink-0" />
                      <span>Vendedor</span>
                    </div>
                    <p className="font-medium">
                      {budget.seller
                        ? `${budget.seller.name} ${budget.seller.lastName}`
                        : 'Sin asignar'}
                    </p>
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                      <Wrench className="h-4 w-4 shrink-0" />
                      <span>Responsable de instalación</span>
                    </div>
                    <p className="font-medium">
                      {budget.installationResponsible === 'company'
                        ? 'A cargo de la empresa'
                        : budget.installationResponsible === 'client'
                          ? 'A cargo del cliente'
                          : budget.installationResponsible === 'other'
                            ? 'Otro'
                            : 'Sin definir'}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="mb-1 text-muted-foreground">Instalador asignado</p>

                  <p className="font-medium">
                    {budget.installer
                      ? `${budget.installer.name} ${budget.installer.lastName}`
                      : 'Sin asignar'}
                  </p>

                  {budget.installer?.phone && (
                    <p className="mt-1 text-muted-foreground">
                      Tel: {budget.installer.phone}
                    </p>
                  )}

                  {budget.installer?.city && (
                    <p className="text-muted-foreground">
                      Ciudad: {budget.installer.city}
                    </p>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  <p className="mb-1 text-muted-foreground">Referencia del instalador</p>
                  <p className="whitespace-pre-wrap break-words">
                    {budget.installerReference?.trim() ? budget.installerReference : '—'}
                  </p>
                </div>

                {Array.isArray(budget.details) &&
                  budget.details.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Información adicional</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {budget.details.map(
                          (
                            detail: {
                              id?: string
                              title?: string
                              value?: string
                            },
                            index: number
                          ) => (
                            <div
                              key={detail.id || index}
                              className="border-b pb-3 last:border-0"
                            >
                              <p className="font-medium">
                                {detail.title}
                              </p>

                              <p className="text-muted-foreground">
                                {detail.value}
                              </p>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Detalle de Items</CardTitle>
              </CardHeader>

              {/* MOBILE */}
              <CardContent className="space-y-3 pt-0 md:hidden">
                {budget.items.map((item) => {
                  const measurements = getItemMeasurementsLabel(item)
                  return (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {getItemDisplayName(item)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.productService?.category
                            ? CATEGORY_LABELS[item.productService.category]
                            : 'Personalizado'}
                        </p>
                        {measurements && (
                          <p className="text-xs text-muted-foreground">{measurements}</p>
                        )}
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Cantidad</span>
                          <span>{item.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Precio unit.</span>
                          <span>{formatCurrency(item.unitPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 font-medium">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="rounded-md border bg-muted/50 p-3">
                  <div className="flex items-center justify-between gap-3 text-base font-bold text-primary">
                    <span>Total</span>
                    <span>{formatCurrency(budget.total)}</span>
                  </div>
                </div>
              </CardContent>

              {/* DESKTOP */}
              <CardContent className="hidden p-0 md:block">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto/Servicio</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budget.items.map((item) => {
                        const measurements = getItemMeasurementsLabel(item)
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="font-medium">
                                {getItemDisplayName(item)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.productService?.category
                                  ? CATEGORY_LABELS[item.productService.category]
                                  : 'Personalizado'}
                              </p>
                              {measurements && (
                                <p className="text-xs text-muted-foreground">{measurements}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        )
                      })}

                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold text-primary">
                          {formatCurrency(budget.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Cobro online</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Solicitar seña</p>
                    <p className="text-xs text-muted-foreground">Pedile al cliente que pague una parte antes del total</p>
                  </div>
                  <Switch
                    checked={depositEnabled}
                    onCheckedChange={(checked) => {
                      setDepositEnabled(checked)
                      saveDepositConfig({ depositEnabled: checked })
                    }}
                  />
                </div>

                {depositEnabled && (
                  <div className="flex items-center gap-2">
                    <Select value={depositType} onValueChange={(v) => setDepositType(v as 'percent' | 'fixed')}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="fixed">$ fijo</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="number"
                      min="0"
                      value={depositValue}
                      onChange={(e) => setDepositValue(e.target.value)}
                      onBlur={() => saveDepositConfig()}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={depositType === 'percent' ? '50' : '10000'}
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isGeneratingLink}
                  onClick={handleCopyPaymentLink}
                >
                  {isGeneratingLink ? 'Generando...' : 'Copiar link de presupuesto'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Estado del Presupuesto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Badge className={STATUS_COLORS[budget.status]}>
                  {STATUS_LABELS[budget.status]}
                </Badge>

                {canChangeStatus ? (
                  <Select
                    value={budget.status}
                    onValueChange={(v) => handleStatusChange(v as BudgetStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Solo lectura</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Historial
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {budget.history?.length ? (
                  budget.history.map((item) => (
                    <div
                      key={item.id}
                      className="border-l-2 pl-4 relative"
                    >
                      <div className="absolute -left-[6px] top-1 h-3 w-3 rounded-full bg-primary" />

                      <p className="font-medium">
                        {STATUS_LABELS[item.to]}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.from !== item.to &&
                          `${STATUS_LABELS[item.from]} → `}
                        {STATUS_LABELS[item.to]}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.changedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin movimientos registrados
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Resumen</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 pt-0 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(budget.subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between gap-3 text-red-600">
                    <span>Descuento</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">IVA</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}

                {(shippingCost ?? 0) > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Envío</span>
                    <span>{formatCurrency(shippingCost ?? 0)}</span>
                  </div>
                )}

                <div className="mt-2 flex justify-between gap-3 border-t pt-2 text-base font-bold text-primary sm:text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(budget.total)}</span>
                </div>

                {budget.notes?.trim() && (
                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">Nota</p>
                    <p className="whitespace-pre-wrap break-words">{budget.notes}</p>
                  </div>
                )}

                {(budget as any).internalNotes?.trim() && (
                  <div className="mt-2 rounded-md border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/10">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
                      Nota interna
                      <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
                        No se imprime
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{(budget as any).internalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hay productos sin stock</DialogTitle>
            <DialogDescription>
              Podés ir a Stock para ajustar cantidades, o aprobar igual y luego comprar el
              material.
            </DialogDescription>
          </DialogHeader>

          {hasStockProblems ? (
            <div className="mt-2 rounded-md border p-3 text-sm">
              <ul className="list-disc space-y-1 pl-5">
                {stockProblems.map((p) => (
                  <li key={p.productServiceId}>
                    <span className="font-medium">{p.name}</span> — faltan{' '}
                    <span className="font-semibold">{p.missing}</span>{' '}
                    <span className="text-muted-foreground">
                      (pedido {p.requested} / stock {p.available})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pudimos obtener el detalle del faltante.
            </p>
          )}

          <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setStockModalOpen(false)
                router.push('/stock')
              }}
            >
              Ir a Stock
            </Button>

            {canChangeStatus && (
              <Button
                type="button"
                onClick={approveAnyway}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? 'Aprobando…' : 'Aprobar igual'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </TooltipProvider>
)
}