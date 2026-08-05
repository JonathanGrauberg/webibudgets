'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CATEGORY_LABELS } from '@/lib/types'
import type { ProductCategory, ProductService } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type ProductWithStock = ProductService & { stock?: number; currency: string }

interface ProductPickerProps {
  products: ProductWithStock[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}

export function ProductPicker({ products, value, onChange, placeholder = 'Seleccionar producto o servicio...' }: ProductPickerProps) {
  const [open, setOpen] = useState(false)

  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name))
  const grouped = sorted.reduce((acc, p) => {
    ;(acc[p.category] ??= []).push(p)
    return acc
  }, {} as Record<string, ProductWithStock[]>)

  const selected = products.find((p) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.name} – ${formatCurrency(selected.price, selected.currency)}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar producto o servicio..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            {Object.entries(grouped).map(([category, items]) => (
              <CommandGroup key={category} heading={CATEGORY_LABELS[category as ProductCategory] ?? category}>
                {items.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.name}
                    onSelect={() => {
                      onChange(p.id)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {formatCurrency(p.price, p.currency)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}