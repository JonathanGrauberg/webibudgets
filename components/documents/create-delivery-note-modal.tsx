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

interface CreateDeliveryNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  budgetNumber: number
  onCreated: () => void
}

export function CreateDeliveryNoteModal({
  open, onOpenChange, budgetId, budgetNumber, onCreated,
}: CreateDeliveryNoteModalProps) {
  const { data: session } = useSession()
  const [vehicle, setVehicle] = useState('')
  const [driverName, setDriverName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [carrierCompany, setCarrierCompany] = useState('')
  const [receivedByName, setReceivedByName] = useState('')
  const [receivedByDni, setReceivedByDni] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/budgets/${budgetId}/delivery-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle: vehicle || null,
          driverName: driverName || null,
          licensePlate: licensePlate || null,
          carrierCompany: carrierCompany || null,
          receivedByName: receivedByName || null,
          receivedByDni: receivedByDni || null,
          notes: notes || null,
          registeredByUserId: (session?.user as any)?.id ?? null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create delivery note')
      const deliveryNote = await res.json()
      window.open(`/api/delivery-notes/${deliveryNote.id}/pdf`, '_blank')
      onCreated()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      alert('No se pudo generar el remito')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Remito — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Todos los campos son opcionales. Los ítems del presupuesto se incluyen automáticamente en el remito.
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transporte</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Vehículo" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
              <Input placeholder="Chofer" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              <Input placeholder="Patente" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
              <Input placeholder="Empresa transportista" value={carrierCompany} onChange={(e) => setCarrierCompany(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recepción</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Recibido por (nombre)" value={receivedByName} onChange={(e) => setReceivedByName(e.target.value)} />
              <Input placeholder="DNI" value={receivedByDni} onChange={(e) => setReceivedByDni(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Mercadería sujeta a revisión / se entrega sin instalación"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generando...' : 'Generar Remito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}