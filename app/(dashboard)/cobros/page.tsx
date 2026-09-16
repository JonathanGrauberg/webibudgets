'use client'
//app\(dashboard)\cobros\page.tsx
//
// Módulo de Cobros — cargos recurrentes a clientes (ej: cuota mensual de
// mantenimiento/marketing), o el pago puntual de un trabajo cuando se
// vincula a un presupuesto (opcional — ver LinkBudgetDialog más abajo, ese
// vínculo hace que este cobro sume al "cobrado" de ese presupuesto en
// Documentos/Rendiciones). Documento propio, con sus propias métricas
// mensuales, separado a propósito de Presupuestos y Documentos para no
// mezclar "lo presupuestado" con "lo que se cobra todos los meses".

import { useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { toast } from 'sonner'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Link2, MessageCircle, Repeat, Trash2, Loader2, Wallet, FileText, X, Landmark } from 'lucide-react'
import { buildWhatsappLink } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/format'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

type Cobro = {
  id: string
  cobroNumber: number
  concept: string
  alias: string | null
  mpSurchargePercent: number | null
  amount: number
  currency: string
  status: 'pending' | 'paid'
  periodMonth: string
  paymentMethod: string | null
  client: { id: string; name: string; company: string | null } | null
  budget: { id: string; budgetNumber: number; total: number } | null
}

type BudgetOption = {
  id: string
  budgetNumber: number
  total: number
  client?: { id: string; name: string | null; company: string | null } | null
}

type Client = { id: string; name: string; company: string | null; whatsappNumber?: string | null }

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function periodOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = -3; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
}

export default function CobrosPage() {
  const [period, setPeriod] = useState(currentPeriod())
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [linkDialogCobro, setLinkDialogCobro] = useState<Cobro | null>(null)

  const { data: cobros, isLoading } = useSWR<Cobro[]>(`/api/cobros?period=${period}`, fetcher)
  const { data: clients } = useSWR<Client[]>('/api/clients', fetcher)

  const summary = useMemo(() => {
    const list = cobros ?? []
    const paid = list.filter((c) => c.status === 'paid')
    const pending = list.filter((c) => c.status === 'pending')
    return {
      count: list.length,
      collected: paid.reduce((acc, c) => acc + c.amount, 0),
      pending: pending.reduce((acc, c) => acc + c.amount, 0),
      pendingCount: pending.length,
    }
  }, [cobros])

  async function ensurePaymentLink(id: string): Promise<string | null> {
    const res = await fetch(`/api/cobros/${id}/payment-link`, { method: 'POST' })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.url) return null
    return json.url as string
  }

  async function handleCopyLink(id: string) {
    setBusyId(id)
    try {
      const url = await ensurePaymentLink(id)
      if (!url) {
        toast.error('No se pudo generar el link')
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado')
    } finally {
      setBusyId(null)
    }
  }

  async function handleSendWhatsapp(cobro: Cobro) {
    const client = clients?.find((c) => c.id === cobro.client?.id)
    if (!client?.whatsappNumber) {
      toast.error('Ese cliente no tiene WhatsApp cargado')
      return
    }
    setBusyId(cobro.id)
    try {
      const url = await ensurePaymentLink(cobro.id)
      const message = url
        ? `Hola ${client.name}! Te comparto el cobro de "${cobro.concept}" (${formatCurrency(cobro.amount, cobro.currency)}): ${url}`
        : `Hola ${client.name}! Te escribo por el cobro de "${cobro.concept}".`
      window.open(buildWhatsappLink(client.whatsappNumber, message), '_blank', 'noopener,noreferrer')
    } finally {
      setBusyId(null)
    }
  }

  async function handleMarkPaid(id: string) {
    if (!confirm('¿Marcar este cobro como pagado (efectivo/transferencia)?')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/cobros/${id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'efectivo' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error ?? 'No se pudo marcar como pagado')
        return
      }
      toast.success('Cobro marcado como pagado')
      mutate(`/api/cobros?period=${period}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/cobros/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        toast.error('No se pudo duplicar el cobro')
        return
      }
      toast.success('Se creó el cobro para el mes que viene')
      mutate((key) => typeof key === 'string' && key.startsWith('/api/cobros?period='))
    } finally {
      setBusyId(null)
    }
  }

  async function handleLinkBudget(cobroId: string, budgetId: string | null) {
    setBusyId(cobroId)
    try {
      const res = await fetch(`/api/cobros/${cobroId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetId }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error ?? 'No se pudo vincular el presupuesto')
        return
      }
      toast.success(budgetId ? 'Presupuesto vinculado' : 'Presupuesto desvinculado')
      mutate(`/api/cobros?period=${period}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este cobro?')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/cobros/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error ?? 'No se pudo eliminar')
        return
      }
      mutate(`/api/cobros?period=${period}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <PageHeader title="Cobros" description="Cargos recurrentes a clientes, sin necesidad de armar un presupuesto">
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo cobro
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Cobrado este mes</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.collected)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pendiente</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(summary.pending)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{summary.pendingCount} cobro{summary.pendingCount !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total del mes</p>
              <p className="mt-1 text-2xl font-bold">{summary.count}</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !cobros || cobros.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">Todavía no hay cobros cargados para este período</p>
              <Button onClick={() => setCreateOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Cargar el primero
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* MOBILE */}
            <div className="space-y-3 md:hidden">
              {cobros.map((c) => (
                <CobroCard
                  key={c.id}
                  cobro={c}
                  busy={busyId === c.id}
                  onCopyLink={() => handleCopyLink(c.id)}
                  onWhatsapp={() => handleSendWhatsapp(c)}
                  onMarkPaid={() => handleMarkPaid(c.id)}
                  onDuplicate={() => handleDuplicate(c.id)}
                  onDelete={() => handleDelete(c.id)}
                  onLinkBudget={() => setLinkDialogCobro(c)}
                  onUnlinkBudget={() => handleLinkBudget(c.id, null)}
                />
              ))}
            </div>

            {/* DESKTOP */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Presupuesto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cobros.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.client?.company || c.client?.name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <span>{c.concept}</span>
                            {c.alias && (
                              <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                                <Landmark className="h-3 w-3" /> {c.alias}
                              </span>
                            )}
                            {c.mpSurchargePercent != null && (
                              <span className="ml-1.5 text-xs text-muted-foreground/60">· MP +{c.mpSurchargePercent}%</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.budget ? (
                              <button
                                type="button"
                                disabled={busyId === c.id}
                                onClick={() => handleLinkBudget(c.id, null)}
                                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                title="Click para desvincular"
                              >
                                <FileText className="h-3 w-3" /> #{String(c.budget.budgetNumber).padStart(6, '0')}
                                <X className="h-3 w-3 opacity-60" />
                              </button>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" disabled={busyId === c.id} onClick={() => setLinkDialogCobro(c)}>
                                <FileText className="h-3.5 w-3.5" /> Vincular
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(c.amount, c.currency)}</TableCell>
                          <TableCell>
                            <Badge className={c.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                              {c.status === 'paid' ? 'Pagado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => handleCopyLink(c.id)} title="Copiar link de cobro">
                                <Link2 className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => handleSendWhatsapp(c)} title="Mandar por WhatsApp" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              {c.status === 'pending' && (
                                <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => handleMarkPaid(c.id)} title="Marcar como pagado">
                                  <Wallet className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => handleDuplicate(c.id)} title="Reutilizar el mes que viene">
                                <Repeat className="h-4 w-4" />
                              </Button>
                              {c.status !== 'paid' && (
                                <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive" title="Eliminar">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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

      <CreateCobroDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients ?? []}
        defaultPeriod={period}
        onCreated={() => mutate(`/api/cobros?period=${period}`)}
      />

      <LinkBudgetDialog
        open={!!linkDialogCobro}
        onOpenChange={(o) => !o && setLinkDialogCobro(null)}
        onSelect={(budgetId) => {
          if (linkDialogCobro) handleLinkBudget(linkDialogCobro.id, budgetId)
          setLinkDialogCobro(null)
        }}
      />
    </div>
  )
}

// 👇 nuevo — buscador simple de presupuesto para vincular un cobro. A
// diferencia del picker de Tareas, acá solo interesa el presupuesto en sí
// (el cobro no se vincula a un recibo o remito puntual).
function LinkBudgetDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (budgetId: string) => void
}) {
  const [search, setSearch] = useState('')
  const { data: budgets = [] } = useSWR<BudgetOption[]>(open ? '/api/budgets' : null, fetcher)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return budgets.slice(0, 20)
    return budgets.filter((b) => {
      const name = (b.client?.company || b.client?.name || '').toLowerCase()
      const num = String(b.budgetNumber ?? 0).padStart(6, '0')
      return name.includes(term) || num.includes(term)
    })
  }, [budgets, search])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSearch(''); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular a un presupuesto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Buscar por cliente o número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b.id)}
                className="flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm hover:bg-muted/50"
              >
                <span>{b.client?.company || b.client?.name || '—'}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatCurrency(b.total)}</span>
                  <span className="font-mono text-xs text-muted-foreground">#{String(b.budgetNumber ?? 0).padStart(6, '0')}</span>
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CobroCard({
  cobro,
  busy,
  onCopyLink,
  onWhatsapp,
  onMarkPaid,
  onDuplicate,
  onDelete,
  onLinkBudget,
  onUnlinkBudget,
}: {
  cobro: Cobro
  busy: boolean
  onCopyLink: () => void
  onWhatsapp: () => void
  onMarkPaid: () => void
  onDuplicate: () => void
  onDelete: () => void
  onLinkBudget: () => void
  onUnlinkBudget: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{cobro.client?.company || cobro.client?.name || '—'}</p>
            <p className="text-xs text-muted-foreground">{cobro.concept}</p>
            {cobro.alias && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/70">
                <Landmark className="h-3 w-3" /> {cobro.alias}
                {cobro.mpSurchargePercent != null && ` · MP +${cobro.mpSurchargePercent}%`}
              </p>
            )}
          </div>
          <Badge className={cobro.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
            {cobro.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </Badge>
        </div>
        <p className="text-lg font-bold">{formatCurrency(cobro.amount, cobro.currency)}</p>
        {cobro.budget ? (
          <button
            type="button"
            disabled={busy}
            onClick={onUnlinkBudget}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            <FileText className="h-3 w-3" /> Presupuesto #{String(cobro.budget.budgetNumber).padStart(6, '0')}
            <X className="h-3 w-3 opacity-60" />
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-0 text-xs text-muted-foreground" disabled={busy} onClick={onLinkBudget}>
            <FileText className="h-3.5 w-3.5" /> Vincular a un presupuesto
          </Button>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={onCopyLink}>
            <Link2 className="mr-1.5 h-3.5 w-3.5" /> Link
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={onWhatsapp} className="border-emerald-300 text-emerald-700">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
          </Button>
          {cobro.status === 'pending' && (
            <Button variant="outline" size="sm" disabled={busy} onClick={onMarkPaid}>
              <Wallet className="mr-1.5 h-3.5 w-3.5" /> Marcar pagado
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={busy} onClick={onDuplicate}>
            <Repeat className="mr-1.5 h-3.5 w-3.5" /> Reutilizar
          </Button>
          {cobro.status !== 'paid' && (
            <Button variant="outline" size="sm" disabled={busy} onClick={onDelete} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CreateCobroDialog({
  open,
  onOpenChange,
  clients,
  defaultPeriod,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  clients: Client[]
  defaultPeriod: string
  onCreated: () => void
}) {
  const [clientId, setClientId] = useState('')
  const [concept, setConcept] = useState('')
  const [alias, setAlias] = useState('')
  const [mpSurchargePercent, setMpSurchargePercent] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState(defaultPeriod)
  const [saving, setSaving] = useState(false)
  const [linkedBudget, setLinkedBudget] = useState<BudgetOption | null>(null)
  const [budgetPickerOpen, setBudgetPickerOpen] = useState(false)

  function reset() {
    setClientId('')
    setConcept('')
    setAlias('')
    setMpSurchargePercent('')
    setAmount('')
    setPeriod(defaultPeriod)
    setLinkedBudget(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !concept.trim() || !amount) {
      toast.error('Completá cliente, concepto y monto')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/cobros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          concept: concept.trim(),
          alias: alias.trim() || null,
          mpSurchargePercent: mpSurchargePercent.trim() ? Number(mpSurchargePercent) : null,
          amount: Number(amount),
          periodMonth: period,
          budgetId: linkedBudget?.id ?? null,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? 'No se pudo crear el cobro')
        return
      }
      toast.success('Cobro creado')
      reset()
      onOpenChange(false)
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cobro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Concepto</label>
            <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Marketing mensual" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alias de transferencia (opcional)</label>
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: empresa.mp" />
            <p className="text-[11px] text-muted-foreground">
              Si lo cargás, se lo mostramos al cliente en la pantalla de pago como alternativa a Mercado Pago — para que pueda transferir directo y evitarse la comisión.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recargo si paga por Mercado Pago (opcional)</label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="any"
                value={mpSurchargePercent}
                onChange={(e) => setMpSurchargePercent(e.target.value)}
                placeholder="Ej: 6.6"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Se le suma a este monto SOLO si el cliente paga con el botón de Mercado Pago — si transfiere por el alias de arriba, paga el monto sin recargo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">
                Mercado Pago descuenta su comisión (según tu plazo de acreditación configurado, ronda 1,5%-6,6%) antes de girarte la plata. Si querés cobrar este monto neto, sumaselo vos al cargarlo. Para configurar o revisar tu %,{' '}
                <a
                  href="https://www.mercadopago.com.ar/costs-section/merchant-svcs/processing/options"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground"
                >
                  entrá acá
                </a>.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Presupuesto / trabajo (opcional)</label>
            {linkedBudget ? (
              <button
                type="button"
                onClick={() => setLinkedBudget(null)}
                className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-100"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> #{String(linkedBudget.budgetNumber).padStart(6, '0')} — {formatCurrency(linkedBudget.total)}
                </span>
                <X className="h-3.5 w-3.5 opacity-60" />
              </button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-muted-foreground" onClick={() => setBudgetPickerOpen(true)}>
                <FileText className="h-3.5 w-3.5" /> Vincular a un presupuesto
              </Button>
            )}
            <p className="text-[11px] text-muted-foreground">
              Si este cobro es el pago (total o parcial) de un trabajo puntual, vinculalo — así se descuenta de lo que falta cobrar en Documentos.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Crear cobro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <LinkBudgetDialog
        open={budgetPickerOpen}
        onOpenChange={setBudgetPickerOpen}
        onSelect={(budgetId) => {
          setBudgetPickerOpen(false)
          fetch(`/api/budgets/${budgetId}`)
            .then((r) => r.json())
            .then((b) => setLinkedBudget({ id: b.id, budgetNumber: b.budgetNumber, total: b.total, client: b.client }))
        }}
      />
    </Dialog>
  )
}
