'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface CreateReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId?: string
  budgetTotal?: number
  alreadyCollected?: number // 👈 nuevo — cuánto ya se cobró con recibos anteriores de este presupuesto
  budgetNumber?: number
  onCreated: () => void
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'otro', label: 'Otro' },
]

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function CreateReceiptModal({
  open, onOpenChange, budgetId, budgetTotal, alreadyCollected, budgetNumber, onCreated,
}: CreateReceiptModalProps) {
  const { data: session } = useSession()
  const isStandalone = !budgetId

  const { data: clients = [] } = useSWR(isStandalone && open ? '/api/clients' : null, fetcher)

  const [clientId, setClientId] = useState('')
  const [amount, setAmount] = useState(budgetTotal ? String(budgetTotal) : '')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentReference, setPaymentReference] = useState('')
  const [issuePlace, setIssuePlace] = useState('')
  const [pendingBalance, setPendingBalance] = useState('')
  const [concept, setConcept] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 👇 nuevo — sugerencia de saldo pendiente = total del presupuesto - lo que se está cobrando ahora.
  // Solo aplica si hay un budgetTotal real (no en recibos standalone, que no tienen un "total" de referencia).
  // Nunca pisa lo que el usuario ya escribió — es puramente un placeholder.
  const parsedAmount = Number(amount)
  const suggestedPendingBalance =
    budgetTotal !== undefined && amount !== '' && !Number.isNaN(parsedAmount)
      ? Math.max(0, budgetTotal - (alreadyCollected ?? 0) - parsedAmount)
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isStandalone && !clientId) {
      alert('Seleccioná un cliente')
      return
    }
    setIsSubmitting(true)
    try {
      const url = isStandalone ? '/api/receipts' : `/api/budgets/${budgetId}/receipts`
      const body = isStandalone
        ? {
            clientId,
            amount: Number(amount),
            paymentMethod,
            paymentReference: paymentReference || null,
            issuePlace: issuePlace || null,
            pendingBalance: pendingBalance !== '' ? Number(pendingBalance) : null,
            concept: concept || null,
            notes: notes || null,
            registeredByUserId: (session?.user as any)?.id ?? null,
          }
        : {
            amount: Number(amount),
            paymentMethod,
            paymentReference: paymentReference || null,
            issuePlace: issuePlace || null,
            // 👇 nuevo — si el usuario no tocó el campo, usamos la sugerencia calculada
            // en vez de mandar null (antes: solo lo que había escrito a mano)
            pendingBalance:
              pendingBalance !== ''
                ? Number(pendingBalance)
                : suggestedPendingBalance,
            notes: notes || null,
            registeredByUserId: (session?.user as any)?.id ?? null,
          }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create receipt')
      const receipt = await res.json()
      window.open(`/api/receipts/${receipt.id}/pdf`, '_blank')
      onCreated()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      alert('No se pudo generar el recibo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isStandalone ? 'Nuevo Recibo' : `Nuevo Recibo — Presupuesto #${String(budgetNumber).padStart(6, '0')}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isStandalone && (
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Importe *</Label>
              <Input type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Medio de pago *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isStandalone && (
            <div className="space-y-2">
              <Label>Concepto (opcional)</Label>
              <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Seña, pago de servicio, etc." />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>N° de operación (opcional)</Label>
              <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Ej: N° de transferencia o cheque" />
            </div>
            <div className="space-y-2">
              <Label>Saldo pendiente (opcional)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={pendingBalance}
                onChange={(e) => setPendingBalance(e.target.value)}
                placeholder={
                  suggestedPendingBalance !== null
                    ? String(suggestedPendingBalance)
                    : 'Si es pago parcial'
                }
              />
              {suggestedPendingBalance !== null && pendingBalance === '' && (
                <p className="text-xs text-muted-foreground">
                  Sugerido: total del presupuesto menos este importe. Escribí otro valor si corresponde.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lugar de emisión (opcional)</Label>
            <Input value={issuePlace} onChange={(e) => setIssuePlace(e.target.value)} placeholder="Ej: Buenos Aires" />
          </div>

          <div className="space-y-2">
            <Label>Observaciones (opcional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generando...' : 'Generar Recibo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}