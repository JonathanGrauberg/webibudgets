// components/budget/client-picker.tsx — nuevo
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Client } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ClientPickerProps {
  clients: Client[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export function ClientPicker({ clients, value, onChange, disabled }: ClientPickerProps) {
  const [open, setOpen] = useState(false)

  const sorted = [...clients].sort((a, b) => (a.company || a.name).localeCompare(b.company || b.name))
  const selected = clients.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.company} - ${selected.name}` : 'Seleccionar cliente...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre o empresa..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {sorted.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.company} ${c.name}`}
                  onSelect={() => { onChange(c.id); setOpen(false) }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === c.id ? 'opacity-100' : 'opacity-0')} />
                  <div className="flex flex-col">
                    <span className="text-sm">{c.company}</span>
                    <span className="text-xs text-muted-foreground">{c.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}