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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MapPin, Trash2, Plus } from 'lucide-react'
import useSWR from 'swr'
import { hasFeature } from '@/lib/features'
import { UpgradeModal } from '@/components/feature-gate'
import { Crown } from 'lucide-react'
import { buildMapLinks } from '@/lib/maps'

interface TenantUser { id: string; name: string }
interface MaterialRow { productServiceId: string | null; customName: string; quantity: number; unit: string }

interface CreateWorkOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  budgetNumber: number
  onCreated: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function CreateWorkOrderModal({
  open, onOpenChange, budgetId, budgetNumber, onCreated,
}: CreateWorkOrderModalProps) {
  const { data: session } = useSession()
  const { data: branding } = useSWR('/api/tenants', (url: string) => fetch(url).then((r) => r.json())) // 👈 nuevo
  const hasWorkOrdersFeature = hasFeature({ plan: branding?.plan, features: branding?.features }, 'workOrders') // 👈 nuevo
  const [upgradeOpen, setUpgradeOpen] = useState(false) // 👈 nuevo
  

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assignedToUserId, setAssignedToUserId] = useState<string>('')
  const [helperUserIds, setHelperUserIds] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTimeFrom, setScheduledTimeFrom] = useState('')
  const [scheduledTimeTo, setScheduledTimeTo] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const mapLinks = buildMapLinks(locationUrl) // 👈 nuevo — se recalcula en cada render mientras escriben

  const [tasksText, setTasksText] = useState('')
  const [toolsText, setToolsText] = useState('')
  const [checklistText, setChecklistText] = useState('')
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [notes, setNotes] = useState('')

  const [users, setUsers] = useState<TenantUser[]>([])
  const [clientLocationUrl, setClientLocationUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]))

    // Traemos el presupuesto para autocompletar materiales y guardar la URL del cliente
    fetch(`/api/budgets/${budgetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((budget) => {
        if (!budget) return
        setClientLocationUrl(budget.client?.locationUrl || null)
        const autoMaterials: MaterialRow[] = (budget.items ?? []).map((item: any) => ({
          productServiceId: item.productServiceId || null,
          customName: item.customName || item.productService?.name || '',
          quantity: item.quantity ?? 1,
          unit: item.productService?.unit || '',
        }))
        setMaterials(autoMaterials)
      })
      .catch(() => {})
  }, [open, budgetId])

  const toggleHelper = (userId: string) => {
    setHelperUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const updateMaterial = (index: number, patch: Partial<MaterialRow>) => {
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  }

  const addMaterialRow = () => {
    setMaterials((prev) => [...prev, { productServiceId: null, customName: '', quantity: 1, unit: '' }])
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium')
    setAssignedToUserId(''); setHelperUserIds([])
    setScheduledDate(''); setScheduledTimeFrom(''); setScheduledTimeTo('')
    setEstimatedHours(''); setLocationUrl('')
    setTasksText(''); setToolsText(''); setChecklistText('')
    setMaterials([]); setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🔒 Dejamos completar TODO el formulario. Recién acá, al querer crear, frenamos.
    if (!hasWorkOrdersFeature) {
      setUpgradeOpen(true)
      return
    }

    setIsSubmitting(true)
    try {
      const toLines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean)

      const res = await fetch(`/api/budgets/${budgetId}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          priority,
          assignedToUserId: assignedToUserId || null,
          helperUserIds,
          scheduledDate: scheduledDate || null,
          scheduledTimeFrom: scheduledTimeFrom || null,
          scheduledTimeTo: scheduledTimeTo || null,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
          locationUrl: locationUrl || null,
          tasks: toLines(tasksText),
          tools: toLines(toolsText),
          checklist: toLines(checklistText),
          materials: materials
            .filter((m) => m.customName?.trim())
            .map((m) => ({
              productServiceId: m.productServiceId,
              customName: m.customName.trim(),
              quantity: m.quantity,
              unit: m.unit || null,
            })),
          notes: notes || null,
          registeredByUserId: (session?.user as any)?.id ?? null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create work order')
      onCreated()
      onOpenChange(false)
      resetForm()
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Trabajo — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos generales */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Ej: Obra de instalación" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Fecha, horario, prioridad */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha y prioridad</Label>
            <div className="grid gap-3 sm:grid-cols-4">
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              <Input type="time" placeholder="Desde" value={scheduledTimeFrom} onChange={(e) => setScheduledTimeFrom(e.target.value)} />
              <Input type="time" placeholder="Hasta" value={scheduledTimeTo} onChange={(e) => setScheduledTimeTo(e.target.value)} />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input type="number" step="0.5" min="0" placeholder="Horas estimadas" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label>Ubicación (link de Google Maps)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://maps.google.com/..."
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
              />
              {clientLocationUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => setLocationUrl(clientLocationUrl)}
                >
                  <MapPin className="h-3.5 w-3.5" /> Copiar del cliente
                </Button>
              )}
            </div>

            {/* 👇 nuevo — solo aparece si hay algo cargado, para chequear antes de guardar */}
            {mapLinks?.google && (
              <a
                href={mapLinks.google}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" /> Ver en el mapa
              </a>
            )}
          </div>

          {/* Personal asignado */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal asignado</Label>
            <Select value={assignedToUserId} onValueChange={setAssignedToUserId}>
              <SelectTrigger><SelectValue placeholder="Responsable" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-md border p-2 space-y-1 max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1">Ayudantes</p>
              {users
                .filter((u) => u.id !== assignedToUserId)
                .map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={helperUserIds.includes(u.id)}
                      onCheckedChange={() => toggleHelper(u.id)}
                    />
                    {u.name}
                  </label>
                ))}
            </div>
          </div>

          {/* Trabajo a realizar */}
          <div className="space-y-2">
            <Label>Trabajo a realizar</Label>
            <Textarea
              rows={4}
              placeholder={'Un ítem por línea, ej:\nCambiar filtro\nColocar cámara de inspección\nRealizar prueba hidráulica'}
              value={tasksText}
              onChange={(e) => setTasksText(e.target.value)}
            />
          </div>

          {/* Materiales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materiales a llevar</Label>
              <Button type="button" variant="ghost" size="sm" className="gap-1 h-7" onClick={addMaterialRow}>
                <Plus className="h-3.5 w-3.5" /> Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Se autocompletaron desde los ítems del presupuesto. Podés editarlos o agregar más.</p>
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="Material"
                    className="flex-1"
                    value={m.customName}
                    onChange={(e) => updateMaterial(i, { customName: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Cant."
                    className="w-20"
                    value={m.quantity}
                    onChange={(e) => updateMaterial(i, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    placeholder="Unidad"
                    className="w-24"
                    value={m.unit}
                    onChange={(e) => updateMaterial(i, { unit: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterial(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              {materials.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Sin materiales cargados</p>
              )}
            </div>
          </div>

          {/* Herramientas */}
          <div className="space-y-2">
            <Label>Herramientas necesarias</Label>
            <Textarea
              rows={3}
              placeholder={'Un ítem por línea, ej:\nPala\nTaladro\nNivel láser'}
              value={toolsText}
              onChange={(e) => setToolsText(e.target.value)}
            />
          </div>

          {/* Checklist de ejecución */}
          <div className="space-y-2">
            <Label>Checklist de ejecución</Label>
            <Textarea
              rows={3}
              placeholder={'Un ítem por línea, ej:\nLlegada a obra\nInstalación realizada\nPrueba hidráulica\nCliente conforme'}
              value={checklistText}
              onChange={(e) => setChecklistText(e.target.value)}
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label>Observaciones para el técnico</Label>
            <Textarea
              rows={2}
              placeholder="Ej: Ingresar por calle lateral. El perro queda suelto. No cortar el suministro eléctrico."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? 'Creando...' : 'Crear Orden'}
              {!hasWorkOrdersFeature && <Crown className="h-3.5 w-3.5 text-amber-300" />}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <UpgradeModal feature="workOrders" open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </Dialog>
  )
}