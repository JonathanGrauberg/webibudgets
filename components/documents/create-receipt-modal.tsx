'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
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
  budgetId: string
  budgetTotal: number
  budgetNumber: number
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

export function CreateReceiptModal({
  open, onOpenChange, budgetId, budgetTotal, budgetNumber, onCreated,
}: CreateReceiptModalProps) {
  const { data: session } = useSession()
  const [amount, setAmount] = useState(String(budgetTotal))
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentReference, setPaymentReference] = useState('')
  const [issuePlace, setIssuePlace] = useState('')
  const [pendingBalance, setPendingBalance] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/budgets/${budgetId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod,
          paymentReference: paymentReference || null,
          issuePlace: issuePlace || null,
          pendingBalance: pendingBalance !== '' ? Number(pendingBalance) : null,
          notes: notes || null,
          registeredByUserId: (session?.user as any)?.id ?? null,
        }),
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
          <DialogTitle>Nuevo Recibo — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>N° de operación (opcional)</Label>
              <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Ej: N° de transferencia o cheque" />
            </div>
            <div className="space-y-2">
              <Label>Saldo pendiente (opcional)</Label>
              <Input type="number" min={0} step="any" value={pendingBalance} onChange={(e) => setPendingBalance(e.target.value)} placeholder="Si es pago parcial" />
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