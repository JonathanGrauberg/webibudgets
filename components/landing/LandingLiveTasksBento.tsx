'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Kanban,
  ArrowRight,
  Link2,
  FileText,
  Receipt,
  Truck,
  GripVertical,
  Users,
  X,
} from 'lucide-react'

type ColumnKey = 'todo' | 'doing' | 'done'
type LinkType = 'budget' | 'receipt' | 'delivery_note' | null

type CardData = {
  id: string
  title: string
  linkType: LinkType
  linkLabel?: string
  column: ColumnKey
}

const COLUMNS: { key: ColumnKey; title: string; dot: string }[] = [
  { key: 'todo', title: 'Por hacer', dot: 'bg-amber-500' },
  { key: 'doing', title: 'En proceso', dot: 'bg-blue-500' },
  { key: 'done', title: 'Terminado', dot: 'bg-emerald-500' },
]

const LINK_META: Record<
  NonNullable<LinkType>,
  { label: string; icon: React.ElementType; className: string }
> = {
  budget: { label: 'Presupuesto', icon: FileText, className: 'bg-slate-100 text-slate-700' },
  receipt: { label: 'Recibo', icon: Receipt, className: 'bg-emerald-100 text-emerald-700' },
  delivery_note: { label: 'Remito', icon: Truck, className: 'bg-blue-100 text-blue-700' },
}

const INITIAL_CARDS: CardData[] = [
  { id: '1', title: 'Mandar presu a Haimovich', linkType: 'budget', linkLabel: '#000003', column: 'todo' },
  { id: '2', title: 'Instalación cartelería — Depósito Norte', linkType: null, column: 'doing' },
  { id: '3', title: 'Revisar pago de NEON', linkType: 'receipt', linkLabel: '#000005', column: 'done' },
]

export function LandingLiveTasksBento() {
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [cards, setCards] = useState<CardData[]>(INITIAL_CARDS)
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null)

  // Solo visual: mueve la tarjeta entre columnas en memoria, no guarda nada
  const handleDrop = (targetColumn: ColumnKey, cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, column: targetColumn } : c))
    )
    setDragOverColumn(null)
  }

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-8">
      {/* Contenedor Oscuro Bento (max-w-7xl) */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-neutral-950 p-8 sm:p-10 lg:p-12 shadow-2xl text-white">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">

          {/* Columna Izquierda: Copy + CTA */}
          <div className="space-y-5 lg:col-span-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-neutral-950"
              style={{ backgroundColor: '#fcc107' }}
            >
              <Kanban className="h-3.5 w-3.5 text-neutral-950" />
              TAREAS EN VIVO
            </span>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-[1.15] text-white">
                Tu equipo, <br />
                <span style={{ color: '#fcc107' }}>sincronizado en vivo.</span>
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-400">
                Un tablero compartido donde cada tarea puede quedar vinculada a un{' '}
                <strong className="text-neutral-200 font-semibold">presupuesto</strong>, un{' '}
                <strong className="text-neutral-200 font-semibold">recibo</strong> o un{' '}
                <strong className="text-neutral-200 font-semibold">remito</strong> real. Movés la
                tarjeta, avanza el estado, y el documento queda a un clic.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-neutral-950 transition-all hover:bg-neutral-200"
              >
                Probar tablero en vivo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-[11px] text-neutral-500">
                Todo el equipo viendo lo mismo, sin planillas paralelas ni grupos de WhatsApp.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Widget Interactivo del Tablero */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-inner">

              {/* Título + Status */}
              <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs font-bold text-neutral-400">
                  Tareas <span className="text-white">· Organizador diario</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <Users className="h-3 w-3" />
                  3 personas viendo
                </span>
              </div>

              <p className="mb-3 text-[10px] text-neutral-500">
                Probá arrastrar una tarjeta a otra columna 👆
              </p>

              {/* Columnas del tablero */}
              <div className="grid grid-cols-3 gap-3">
                {COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverColumn(col.key)
                    }}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      const cardId = e.dataTransfer.getData('cardId')
                      if (cardId) handleDrop(col.key, cardId)
                    }}
                    className={`rounded-xl border p-2.5 space-y-2 min-h-[190px] transition-colors ${
                      dragOverColumn === col.key
                        ? 'border-neutral-600 bg-neutral-900'
                        : 'border-neutral-800 bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 px-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                        {col.title}
                      </span>
                    </div>

                    {cards
                      .filter((c) => c.column === col.key)
                      .map((card) => {
                        const meta = card.linkType ? LINK_META[card.linkType] : null
                        return (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('cardId', card.id)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            className="cursor-grab select-none rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 space-y-1.5 transition-shadow hover:shadow-md active:cursor-grabbing"
                          >
                            <div className="flex items-start gap-1">
                              <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-neutral-700" />
                              <p className="text-[11px] leading-snug text-neutral-200">{card.title}</p>
                            </div>

                            {meta ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${meta.className}`}
                              >
                                <meta.icon className="h-2.5 w-2.5" />
                                {meta.label} {card.linkLabel}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowLinkPicker(true)}
                                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
                              >
                                <Link2 className="h-2.5 w-2.5" /> Vincular
                              </button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>

              {/* Mini preview del modal de vinculación, al estilo del screenshot */}
              {showLinkPicker && (
                <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 animate-in fade-in duration-200">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white">#000008 — ¿A qué vincular?</span>
                    <button
                      type="button"
                      onClick={() => setShowLinkPicker(false)}
                      className="text-neutral-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-[11px] text-neutral-300">
                      <FileText className="h-3 w-3" /> Vincular directo al presupuesto
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-[11px] text-neutral-300">
                      <Receipt className="h-3 w-3" /> Recibo N° 00000005
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] italic text-neutral-500">
                    Cada tarea queda a un clic del documento real: sin buscar en carpetas ni pestañas.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}