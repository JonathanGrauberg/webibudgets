'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Download, ChevronDown, ChevronUp, Ban, Pause } from 'lucide-react'

type ChecklistItem = { id: string; label: string; completed: boolean }
type WorkOrder = {
  id: string
  workOrderNumber: number
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'voided'
  title: string | null
  scheduledDate: string | null
  assignedToUser: { name: string } | null
  checklist: ChecklistItem[]
  pauseReason: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  voided: 'Anulada',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  in_progress: 'default',
  paused: 'secondary',
  completed: 'secondary',
  cancelled: 'destructive',
  voided: 'destructive',
}

// Acciones de flujo de trabajo normal — no incluyen "voided" a propósito,
// esa es una acción administrativa aparte, siempre visible, no un paso del flujo.
const NEXT_ACTIONS: Record<string, { label: string; status: string; icon?: React.ElementType; needsConfirm?: boolean; needsReason?: boolean }[]> = {
  pending: [
    { label: 'Iniciar', status: 'in_progress' },
    { label: 'Cancelar', status: 'cancelled', needsConfirm: true },
  ],
  in_progress: [
    { label: 'Pausar', status: 'paused', icon: Pause, needsReason: true },
    { label: 'Completar', status: 'completed' },
    { label: 'Cancelar', status: 'cancelled', needsConfirm: true },
  ],
  paused: [
    { label: 'Reanudar', status: 'in_progress' },
    { label: 'Cancelar', status: 'cancelled', needsConfirm: true },
  ],
  completed: [],
  cancelled: [],
  voided: [],
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface WorkOrdersHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetId: string
  budgetNumber: number
}

export function WorkOrdersHistoryModal({ open, onOpenChange, budgetId, budgetNumber }: WorkOrdersHistoryModalProps) {
  const key = open ? `/api/budgets/${budgetId}/work-orders` : null
  const { data: workOrders = [], isLoading } = useSWR<WorkOrder[]>(key, fetcher)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleStatusChange = async (
    id: string,
    status: string,
    opts?: { needsConfirm?: boolean; needsReason?: boolean; confirmMessage?: string }
  ) => {
    if (opts?.needsConfirm) {
      const msg = opts.confirmMessage ?? '¿Confirmás este cambio de estado? Esta acción queda registrada.'
      if (!confirm(msg)) return
    }

    let pauseReason: string | null = null
    if (opts?.needsReason) {
      pauseReason = window.prompt('Motivo de la pausa (opcional):') || null
    }

    const res = await fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(pauseReason !== null ? { pauseReason } : {}) }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      alert(body?.error || 'No se pudo cambiar el estado')
      return
    }
    mutate(key)
  }

  const handleVoid = (id: string) => {
    handleStatusChange(id, 'voided', {
      needsConfirm: true,
      confirmMessage: '¿Anular esta orden de trabajo? Esta acción queda registrada y no se puede deshacer.',
    })
  }

  // 👇 Optimistic update: el check se tilda al instante en pantalla,
  // y recién después confirma contra el server. Si falla, se revierte solo.
  const handleToggleChecklistItem = async (workOrderId: string, itemId: string, completed: boolean) => {
    const optimisticData = (current: WorkOrder[] = []) =>
      current.map((w) =>
        w.id === workOrderId
          ? { ...w, checklist: w.checklist.map((c) => (c.id === itemId ? { ...c, completed } : c)) }
          : w
      )

    await mutate(
      key,
      async (current: WorkOrder[] = []) => {
        const res = await fetch(`/api/work-orders/${workOrderId}/checklist/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed }),
        })
        if (!res.ok) throw new Error('No se pudo actualizar el ítem')
        return optimisticData(current)
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
      }
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Órdenes de Trabajo — Presupuesto #{String(budgetNumber).padStart(6, '0')}</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
          ) : workOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no se creó ninguna orden de trabajo para este presupuesto.
            </p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {workOrders.map((w) => {
                const isExpanded = expandedId === w.id
                const completedCount = w.checklist.filter((c) => c.completed).length
                const isVoided = w.status === 'voided'
                return (
                  <div key={w.id} className={`rounded-lg border p-3 text-sm ${isVoided ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          N° {String(w.workOrderNumber).padStart(6, '0')} {w.title ? `— ${w.title}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {w.assignedToUser?.name || 'Sin técnico asignado'}
                          {w.scheduledDate ? ` · ${new Date(w.scheduledDate).toLocaleDateString('es-AR')}` : ''}
                          {w.checklist.length > 0 ? ` · ${completedCount}/${w.checklist.length} ítems` : ''}
                        </p>
                        {w.status === 'paused' && w.pauseReason && (
                          <p className="text-xs text-amber-600 mt-0.5">⏸ {w.pauseReason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant={STATUS_VARIANT[w.status]}>{STATUS_LABEL[w.status]}</Badge>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`/api/work-orders/${w.id}/pdf`} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Descargar PDF</TooltipContent>
                        </Tooltip>

                        {!isVoided && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleVoid(w.id)}>
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Anular orden</TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setExpandedId(isExpanded ? null : w.id)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isExpanded ? 'Colapsar' : 'Ver detalle y checklist'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {w.checklist.length > 0 && (
                          <div className="space-y-1.5">
                            {w.checklist.map((item) => (
                              <label key={item.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                <Checkbox
                                  checked={item.completed}
                                  disabled={isVoided}
                                  onCheckedChange={(checked) => handleToggleChecklistItem(w.id, item.id, !!checked)}
                                />
                                <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                  {item.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {!isVoided && NEXT_ACTIONS[w.status].length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {NEXT_ACTIONS[w.status].map((action) => (
                              <Button
                                key={action.status}
                                size="sm"
                                variant={action.needsConfirm ? 'outline' : 'default'}
                                className="gap-1.5"
                                onClick={() =>
                                  handleStatusChange(w.id, action.status, {
                                    needsConfirm: action.needsConfirm,
                                    needsReason: action.needsReason,
                                  })
                                }
                              >
                                {action.icon && <action.icon className="h-3.5 w-3.5" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}