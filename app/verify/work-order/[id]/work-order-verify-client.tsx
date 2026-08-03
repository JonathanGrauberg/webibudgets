// app/verify/work-order/[id]/work-order-verify-client.tsx
'use client'

import useSWR from 'swr'
import { Loader2 } from 'lucide-react'
import { WorkOrderDetailContent } from '@/components/work-orders/work-order-detail-content'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function WorkOrderVerifyClient({ workOrderId }: { workOrderId: string }) {
  const { data: workOrder, isLoading, mutate } = useSWR(
    `/api/work-orders/${workOrderId}`,
    fetcher,
    { refreshInterval: 4000 } // 👈 polling — se actualiza solo si otro dispositivo tildó algo
  )

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    // Optimista: se ve al toque, y el próximo poll confirma o corrige
    mutate(
      (current: any) =>
        current
          ? { ...current, checklist: current.checklist.map((c: any) => (c.id === itemId ? { ...c, completed } : c)) }
          : current,
      { revalidate: false }
    )
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      if (!res.ok) throw new Error()
      mutate() // confirma contra el server
    } catch {
      mutate() // revierte trayendo el estado real
    }
  }

  if (isLoading || !workOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

        <WorkOrderDetailContent
          workOrder={workOrder}
          onToggleChecklistItem={handleToggleItem}
          disabled={workOrder.status === 'voided'}
        />
      </div>
    </div>
  )
}