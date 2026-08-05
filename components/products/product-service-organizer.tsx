// components/products/product-service-organizer.tsx
'use client'

import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import type { ProductService } from '@/lib/types'
import { formatCurrency } from '@/lib/format'

interface ProductServiceOrganizerProps {
  products: ProductService[]
  serviceProductIds: string[]
  onChange: (serviceProductIds: string[]) => void
}

function ItemRow({ product, onDragStart }: { product: ProductService; onDragStart: (id: string) => void }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(product.id)}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm active:cursor-grabbing"
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      <span className="flex-1 truncate">{product.name}</span>
      <span className="shrink-0 text-xs text-slate-400">{formatCurrency(product.price, product.currency)}</span>
    </div>
  )
}

function Column({
  title,
  items,
  onDrop,
  onDragStart,
}: {
  title: string
  items: ProductService[]
  onDrop: () => void
  onDragStart: (id: string) => void
}) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => { setIsOver(false); onDrop() }}
      className={`flex h-[420px] flex-col rounded-xl border-2 border-dashed p-3 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <div className="mb-2 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">Soltá acá para mover</p>
        ) : (
          items.map((p) => <ItemRow key={p.id} product={p} onDragStart={onDragStart} />)
        )}
      </div>
    </div>
  )
}

export function ProductServiceOrganizer({ products, serviceProductIds, onChange }: ProductServiceOrganizerProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const serviceSet = new Set(serviceProductIds)
  const services = products.filter((p) => serviceSet.has(p.id))
  const items = products.filter((p) => !serviceSet.has(p.id)) // 👈 default: todo arranca en "Productos"

  const moveTo = (bucket: 'products' | 'services') => {
    if (!draggingId) return
    const isCurrentlyService = serviceSet.has(draggingId)
    if (bucket === 'services' && !isCurrentlyService) {
      onChange([...serviceProductIds, draggingId])
    } else if (bucket === 'products' && isCurrentlyService) {
      onChange(serviceProductIds.filter((id) => id !== draggingId))
    }
    setDraggingId(null)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Column title="Productos" items={items} onDrop={() => moveTo('products')} onDragStart={setDraggingId} />
      <Column title="Servicios" items={services} onDrop={() => moveTo('services')} onDragStart={setDraggingId} />
    </div>
  )
}