'use client'

import useSWR, { mutate } from 'swr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Ban } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

type Receipt = {
  id: string
  receiptNumber: number
  amount: number
  currency: string
  issueDate: string
  paymentMethod: string
  status: 'active' | 'voided'
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  mercado_pago: 'Mercado Pago',
  otro: 'Otro',
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface ReceiptsHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  budgetNumber: number
}

export function ReceiptsHistoryModal({ open, onOpenChange, budgetId, budgetNumber }: ReceiptsHistoryModalProps) {
  const key = open ? `/api/budgets/${budgetId}/receipts` : null
  const { data: receipts = [], isLoading } = useSWR<Receipt[]>(key, fetcher)

  const handleVoid = async (receiptId: string) => {
    if (!confirm('¿Anular este recibo? Esta acción queda registrada y no se puede deshacer.')) return
    const res = await fetch(`/api/receipts/${receiptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'voided' }),
    })
    if (!res.ok) {
      alert('No se pudo anular el recibo')
      return
    }
    mutate(key)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recibos — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
        ) : receipts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no se generó ningún recibo para este presupuesto.
          </p>
        ) : (
          <div className="space-y-2">
            {receipts.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                  r.status === 'voided' ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium">
                    N° {String(r.receiptNumber).padStart(8, '0')} · {formatCurrency(r.amount, r.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[r.paymentMethod] ?? r.paymentMethod} ·{' '}
                    {new Date(r.issueDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'voided' ? 'secondary' : 'default'}>
                    {r.status === 'voided' ? 'Anulado' : 'Activo'}
                  </Badge>
                  <a href={`/api/receipts/${r.id}/pdf`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </a>
                  {r.status === 'active' && (
                    <Button variant="ghost" size="icon" onClick={() => handleVoid(r.id)}>
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}