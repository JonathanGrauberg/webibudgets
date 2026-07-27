'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, FileText, Receipt, Truck, ArrowLeft } from 'lucide-react'
import type { Budget } from '@/lib/types'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface LinkPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (linkType: 'budget' | 'receipt' | 'delivery_note', linkId: string, label: string) => void
}

export function LinkPickerModal({ open, onOpenChange, onSelect }: LinkPickerModalProps) {
  const [search, setSearch] = useState('')
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)

  const { data: budgets = [] } = useSWR<Budget[]>(open ? '/api/budgets' : null, fetcher)
  const { data: receipts = [] } = useSWR<any[]>(
    selectedBudget ? `/api/budgets/${selectedBudget.id}/receipts` : null,
    fetcher
  )
  const { data: deliveryNotes = [] } = useSWR<any[]>(
    selectedBudget ? `/api/budgets/${selectedBudget.id}/delivery-notes` : null,
    fetcher
  )

  const filteredBudgets = budgets.filter((b) => {
    const name = (b.client?.company || b.client?.name || '').toLowerCase()
    const num = String(b.budgetNumber ?? 0).padStart(6, '0')
    return !search || name.includes(search.toLowerCase()) || num.includes(search)
  })

  const handleClose = (o: boolean) => {
    if (!o) {
      setSelectedBudget(null)
      setSearch('')
    }
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogOverlay className="bg-black/70 backdrop-blur-[2px]" />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedBudget
              ? `#${String(selectedBudget.budgetNumber ?? 0).padStart(6, '0')} — ¿A qué vincular?`
              : 'Vincular a un presupuesto'}
          </DialogTitle>
        </DialogHeader>

        {!selectedBudget ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {filteredBudgets.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBudget(b)}
                  className="flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm hover:bg-muted/50"
                >
                  <span>{b.client?.company || b.client?.name || '—'}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    #{String(b.budgetNumber ?? 0).padStart(6, '0')}
                  </span>
                </button>
              ))}
              {filteredBudgets.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin resultados</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => setSelectedBudget(null)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a buscar
            </Button>

            <button
              type="button"
              onClick={() => {
                onSelect('budget', selectedBudget.id, `Presupuesto #${String(selectedBudget.budgetNumber ?? 0).padStart(6, '0')}`)
                handleClose(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted/50"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              Vincular directo al presupuesto
            </button>

            {receipts.filter((r) => r.status === 'active').map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelect('receipt', r.id, `Recibo N° ${String(r.receiptNumber).padStart(8, '0')}`)
                  handleClose(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted/50"
              >
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Recibo N° {String(r.receiptNumber).padStart(8, '0')}
              </button>
            ))}

            {deliveryNotes.filter((d) => d.status === 'active').map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  onSelect('delivery_note', d.id, `Remito N° ${String(d.deliveryNumber).padStart(8, '0')}`)
                  handleClose(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted/50"
              >
                <Truck className="h-4 w-4 text-muted-foreground" />
                Remito N° {String(d.deliveryNumber).padStart(8, '0')}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}