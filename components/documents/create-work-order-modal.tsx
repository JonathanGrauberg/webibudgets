'use client'

import { useState, useEffect } from 'react'
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

interface TenantUser {
  id: string
  name: string
}

interface CreateWorkOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  budgetNumber: number
  onCreated: () => void
}

export function CreateWorkOrderModal({
  open, onOpenChange, budgetId, budgetNumber, onCreated,
}: CreateWorkOrderModalProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedToUserId, setAssignedToUserId] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [checklistText, setChecklistText] = useState('')
  const [notes, setNotes] = useState('')
  const [users, setUsers] = useState<TenantUser[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const checklist = checklistText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)

      const res = await fetch(`/api/budgets/${budgetId}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          assignedToUserId: assignedToUserId || null,
          scheduledDate: scheduledDate || null,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
          checklist,
          notes: notes || null,
          registeredByUserId: (session?.user as any)?.id ?? null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create work order')
      onCreated()
      onOpenChange(false)
      setTitle(''); setDescription(''); setAssignedToUserId('')
      setScheduledDate(''); setEstimatedHours(''); setChecklistText(''); setNotes('')
    } catch (err) {
      console.error(err)
      alert('No se pudo crear la orden de trabajo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Trabajo — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Ej: Instalación de equipo" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Descripción del trabajo</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Técnico asignado</Label>
              <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha programada</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horas estimadas</Label>
            <Input type="number" step="0.5" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Checklist</Label>
            <Textarea
              rows={4}
              placeholder={'Un ítem por línea, ej:\nRevisar instalación eléctrica\nProbar equipo\nLimpiar zona de trabajo'}
              value={checklistText}
              onChange={(e) => setChecklistText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Orden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}