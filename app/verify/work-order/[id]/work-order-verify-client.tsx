'use client'

import { useState } from 'react'
import { MapPin, CheckCircle2, Circle, Package, Wrench, ListChecks } from 'lucide-react'
import { buildMapLinks } from '@/lib/maps'

export function WorkOrderVerifyClient({ workOrder }: { workOrder: any }) {
  const [checklist, setChecklist] = useState(workOrder.checklist)
  const { google: googleMapsUrl, apple: appleMapsUrl } = buildMapLinks(workOrder.locationUrl) ?? { google: null, apple: null }


  const toggleItem = async (itemId: string, current: boolean) => {
    // Optimista: actualiza al toque, revierte si falla
    setChecklist((prev: any) =>
      prev.map((i: any) => (i.id === itemId ? { ...i, completed: !current } : i))
    )
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !current }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setChecklist((prev: any) =>
        prev.map((i: any) => (i.id === itemId ? { ...i, completed: current } : i))
      )
    }
  }

  const completedCount = checklist.filter((i: any) => i.completed).length

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-12">
      <div className="mx-auto max-w-lg space-y-4 pt-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Orden de Trabajo N° {String(workOrder.workOrderNumber).padStart(6, '0')}
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            {workOrder.title || workOrder.budget?.client?.company || workOrder.budget?.client?.name || 'Sin título'}
          </h1>
          {workOrder.description && (
            <p className="mt-1 text-sm text-slate-600">{workOrder.description}</p>
          )}
        </div>

        {/* Mapa */}
        {googleMapsUrl && (
          <div className="flex gap-2">
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
            >
              <MapPin className="h-4 w-4" /> Google Maps
            </a>
            {appleMapsUrl && (
              <a
                href={appleMapsUrl}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700"
              >
                <MapPin className="h-4 w-4" /> Apple Maps
              </a>
            )}
          </div>
        )}

        {/* Checklist */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ListChecks className="h-4 w-4" /> Checklist de ejecución
            </h2>
            <span className="text-xs text-slate-400">{completedCount}/{checklist.length}</span>
          </div>
          <div className="space-y-1">
            {checklist.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id, item.completed)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50"
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
            ))}
            {checklist.length === 0 && (
              <p className="py-2 text-xs text-slate-400">Sin checklist cargado.</p>
            )}
          </div>
        </div>

        {/* Tareas */}
        {workOrder.tasks?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Trabajo a realizar</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {workOrder.tasks.map((t: any) => <li key={t.id}>{t.label}</li>)}
            </ul>
          </div>
        )}

        {/* Materiales */}
        {workOrder.materials?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Package className="h-4 w-4" /> Materiales a llevar
            </h2>
            <ul className="space-y-1 text-sm text-slate-700">
              {workOrder.materials.map((m: any) => (
                <li key={m.id} className="flex justify-between">
                  <span>{m.customName}</span>
                  <span className="text-slate-400">{m.quantity} {m.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Herramientas */}
        {workOrder.tools?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Wrench className="h-4 w-4" /> Herramientas necesarias
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {workOrder.tools.map((t: any) => <li key={t.id}>{t.label}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}