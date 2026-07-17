'use client'

import useSWR, { mutate } from 'swr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Ban } from 'lucide-react'

type DeliveryNote = {
  id: string
  deliveryNumber: number
  issueDate: string
  status: 'active' | 'voided'
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface DeliveryNotesHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  budgetNumber: number
}

export function DeliveryNotesHistoryModal({ open, onOpenChange, budgetId, budgetNumber }: DeliveryNotesHistoryModalProps) {
  const key = open ? `/api/budgets/${budgetId}/delivery-notes` : null
  const { data: deliveryNotes = [], isLoading } = useSWR<DeliveryNote[]>(key, fetcher)

  const handleVoid = async (id: string) => {
    if (!confirm('¿Anular este remito? Esta acción queda registrada y no se puede deshacer.')) return
    const res = await fetch(`/api/delivery-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'voided' }),
    })
    if (!res.ok) {
      alert('No se pudo anular el remito')
      return
    }
    mutate(key)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Remitos — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
        ) : deliveryNotes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no se generó ningún remito para este presupuesto.
          </p>
        ) : (
          <div className="space-y-2">
            {deliveryNotes.map((d) => (
              <div
                key={d.id}
                className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                  d.status === 'voided' ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium">N° {String(d.deliveryNumber).padStart(8, '0')}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.issueDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={d.status === 'voided' ? 'secondary' : 'default'}>
                    {d.status === 'voided' ? 'Anulado' : 'Activo'}
                  </Badge>
                  <a href={`/api/delivery-notes/${d.id}/pdf`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </a>
                  {d.status === 'active' && (
                    <Button variant="ghost" size="icon" onClick={() => handleVoid(d.id)}>
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