'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Plus, Trash2, Tag } from 'lucide-react'

interface ExtraItem {
  id: string
  description: string
  amount: number
}

export function LandingFreeItemBento() {
  const [items, setItems] = useState<ExtraItem[]>([
    { id: '1', description: 'Mano de obra y montaje en obra', amount: 45000 },
    { id: '2', description: 'Flete y traslado especializado', amount: 18000 },
  ])
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDesc.trim() || !newAmount) return
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: newDesc,
        amount: parseFloat(newAmount) || 0,
      },
    ])
    setNewDesc('')
    setNewAmount('')
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const totalExtra = items.reduce((acc, item) => acc + item.amount, 0)

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      {/* Contenedor Bento alineado al grid max-w-7xl */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-black/5 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 p-8 sm:p-10 lg:p-12 shadow-sm dark:border-white/10 dark:from-neutral-900 dark:to-neutral-950">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          
          {/* Columna Izquierda: Copy + CTA */}
          <div className="space-y-5 lg:col-span-5">
            <span 
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-neutral-900"
              style={{ backgroundColor: '#fcc10720' }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: '#fcc107' }} />
              FLEXIBILIDAD ABSOLUTA
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-white leading-[1.15]">
                Items libres <br />
                <span style={{ color: '#fcc107' }}>al instante.</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-600 dark:text-neutral-400">
                No te atés a un catálogo rígido. Agregá imprevistos, mano de obra, viáticos o servicios a medida directamente en el presupuesto.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-xs font-bold text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Creá tu primer presupuesto
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-[11px] text-neutral-400">
                Sin límites de items ni configuraciones complejas.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Widget Interactivo de Items Libres */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              
              {/* Cabecera del Widget */}
              <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Conceptos adicionales
                  </span>
                </div>
                <span className="text-xs font-bold text-neutral-500">
                  Subtotal: <span style={{ color: '#fcc107' }}>${totalExtra.toLocaleString('es-AR')}</span>
                </span>
              </div>

              {/* Formulario de carga en vivo */}
              <form onSubmit={handleAddItem} className="mb-4 grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Ej. Colocación de perfilería"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="col-span-6 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Monto ($)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="col-span-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="col-span-2 flex items-center justify-center rounded-lg font-bold text-neutral-950 transition-all hover:opacity-90"
                  style={{ backgroundColor: '#fcc107' }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {/* Listado dinámico */}
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/70 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-950/50"
                  >
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        ${item.amount.toLocaleString('es-AR')}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}