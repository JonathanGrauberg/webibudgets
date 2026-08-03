'use client'
//components\work-orders\work-order-detail-content.tsx
import { MapPin, Package, Wrench, CheckCircle2, Circle } from 'lucide-react'
import { buildMapLinks } from '@/lib/maps'
import { Checkbox } from '@/components/ui/checkbox'


type ChecklistItem = { id: string; label: string; completed: boolean }

interface WorkOrderDetailContentProps {
  workOrder: {
    locationUrl?: string | null
    tasks?: { id: string; label: string }[]
    materials?: { id: string; customName?: string | null; productService?: { name: string } | null; quantity: number; unit?: string | null }[]
    tools?: { id: string; label: string }[]
    checklist: ChecklistItem[]
  }
  onToggleChecklistItem: (itemId: string, completed: boolean) => void
  disabled?: boolean
  compact?: boolean // 👈 el modal de historial usa un layout más denso que la vista full-screen del QR/kiosco
}

export function WorkOrderDetailContent({
  workOrder,
  onToggleChecklistItem,
  disabled = false,
  compact = false,
}: WorkOrderDetailContentProps) {
  const { google: googleMapsUrl, apple: appleMapsUrl } = buildMapLinks(workOrder.locationUrl) ?? { google: null, apple: null }
  const completedCount = workOrder.checklist.filter((c) => c.completed).length

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {googleMapsUrl && (
        <div className="flex gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 text-white ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} font-semibold`}
          >
            <MapPin className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> Google Maps
          </a>
          {appleMapsUrl && (
            <a
              href={appleMapsUrl}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-700 ${compact ? 'py-2 text-xs' : 'py-3 text-sm'} font-semibold`}
            >
              <MapPin className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> Apple Maps
            </a>
          )}
        </div>
      )}

      {workOrder.checklist.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className={compact ? 'text-xs font-semibold text-slate-700' : 'text-sm font-semibold text-slate-900'}>
              Checklist
            </p>
            <span className="text-xs text-slate-400">{completedCount}/{workOrder.checklist.length}</span>
          </div>
          <div className="space-y-1">
            {workOrder.checklist.map((item) =>
              compact ? (
                <label key={item.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={item.completed}
                    disabled={disabled}
                    onCheckedChange={(checked) => onToggleChecklistItem(item.id, !!checked)}
                  />
                  <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
                </label>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleChecklistItem(item.id, !item.completed)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                  <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {item.label}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {(workOrder.tasks?.length ?? 0) > 0 && (
        <div>
          <p className={compact ? 'mb-1 text-xs font-semibold text-slate-700' : 'mb-2 text-sm font-semibold text-slate-900'}>
            Trabajo a realizar
          </p>
          <ul className={`list-disc pl-5 ${compact ? 'text-xs' : 'text-sm'} text-slate-700 space-y-0.5`}>
            {workOrder.tasks!.map((t) => <li key={t.id}>{t.label}</li>)}
          </ul>
        </div>
      )}

      {(workOrder.materials?.length ?? 0) > 0 && (
        <div>
          <p className={`flex items-center gap-1.5 ${compact ? 'mb-1 text-xs font-semibold text-slate-700' : 'mb-2 text-sm font-semibold text-slate-900'}`}>
            <Package className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> Materiales
          </p>
          <ul className={`${compact ? 'text-xs' : 'text-sm'} text-slate-700 space-y-0.5`}>
            {workOrder.materials!.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span>{m.customName || m.productService?.name || '—'}</span>
                <span className="text-slate-400">{m.quantity} {m.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(workOrder.tools?.length ?? 0) > 0 && (
        <div>
          <p className={`flex items-center gap-1.5 ${compact ? 'mb-1 text-xs font-semibold text-slate-700' : 'mb-2 text-sm font-semibold text-slate-900'}`}>
            <Wrench className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> Herramientas
          </p>
          <ul className={`list-disc pl-5 ${compact ? 'text-xs' : 'text-sm'} text-slate-700 space-y-0.5`}>
            {workOrder.tools!.map((t) => <li key={t.id}>{t.label}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}