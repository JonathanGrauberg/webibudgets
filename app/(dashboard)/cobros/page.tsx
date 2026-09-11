'use client'
//app\(dashboard)\cobros\page.tsx
//
// Módulo de Cobros — cargos recurrentes a clientes SIN presupuesto (ej:
// cuota mensual de mantenimiento/marketing). Documento propio, con sus
// propias métricas mensuales, separado a propósito de Presupuestos y
// Documentos para no mezclar "lo presupuestado" con "lo que se cobra todos
// los meses".

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
import { Plus, Link2, MessageCircle, Repeat, Trash2, Loader2, Wallet } from 'lucide-react'
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
  amount: number
  currency: string
  status: 'pending' | 'paid'
  periodMonth: string
  paymentMethod: string | null
  client: { id: string; name: string; company: string | null } | null
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
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cobros.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.client?.company || c.client?.name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.concept}</TableCell>
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
    </div>
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
}: {
  cobro: Cobro
  busy: boolean
  onCopyLink: () => void
  onWhatsapp: () => void
  onMarkPaid: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{cobro.client?.company || cobro.client?.name || '—'}</p>
            <p className="text-xs text-muted-foreground">{cobro.concept}</p>
          </div>
          <Badge className={cobro.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
            {cobro.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </Badge>
        </div>
        <p className="text-lg font-bold">{formatCurrency(cobro.amount, cobro.currency)}</p>
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
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState(defaultPeriod)
  const [saving, setSaving] = useState(false)

  function reset() {
    setClientId('')
    setConcept('')
    setAmount('')
    setPeriod(defaultPeriod)
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
        body: JSON.stringify({ clientId, concept: concept.trim(), amount: Number(amount), periodMonth: period }),
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
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

          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Crear cobro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
