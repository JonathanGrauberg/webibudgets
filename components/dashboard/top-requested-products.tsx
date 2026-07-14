'use client'

import { useMemo } from 'react'
import { CATEGORY_LABELS, type ProductCategory } from '@/lib/types'

type TopRequestedProduct = {
  productServiceId: string
  name: string
  unit: string
  category: string
  requestCount: number
}

interface TopRequestedProductsProps {
  products: TopRequestedProduct[]
  accentColor?: string | null
}

export function TopRequestedProducts({ products, accentColor }: TopRequestedProductsProps) {
  const accent = accentColor || '#0f172a'
  const maxCount = useMemo(
    () => Math.max(1, ...products.map((p) => p.requestCount)),
    [products]
  )

  if (products.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Todavía no hay ítems solicitados en presupuestos.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((p, idx) => (
        <div key={p.productServiceId} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {String(idx + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-card-foreground">{p.name}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {p.requestCount} presup.
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(p.requestCount / maxCount) * 100}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {CATEGORY_LABELS[p.category as ProductCategory] ?? p.category} · por {p.unit}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}