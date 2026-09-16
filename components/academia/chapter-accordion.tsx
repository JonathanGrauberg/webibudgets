'use client'
// components/academia/chapter-accordion.tsx
//
// Lista de "pasos" de un capítulo, colapsados por default — para que la
// guía no se vea como una pared de texto apenas se entra. Cada paso se abre
// solo, sin acordeón exclusivo (podés tener más de uno abierto a la vez).

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { GuiaPaso } from '@/lib/guias-data'

export function ChapterAccordion({ pasos }: { pasos: GuiaPaso[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0) // el primer paso arranca abierto, invita a seguir

  return (
    <div className="mt-5 space-y-3">
      {pasos.map((paso, i) => {
        const open = openIndex === i
        return (
          <div key={paso.titulo} className="overflow-hidden rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-muted/50"
              aria-expanded={open}
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  {i + 1}
                </span>
                {paso.titulo}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="space-y-2 border-t border-border px-5 py-4 pl-[3.25rem] text-sm text-muted-foreground">
                {paso.contenido.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
