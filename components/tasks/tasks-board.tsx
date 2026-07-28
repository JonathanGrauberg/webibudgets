'use client'

import React, { useState, useCallback, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash, Link2, FileText, Receipt, Truck, GripVertical, Inbox,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { LinkPickerModal } from './link-picker-modal'

type TaskColumn = 'backlog' | 'todo' | 'doing' | 'done'
type TaskLinkType = 'budget' | 'receipt' | 'delivery_note' | null

type Task = {
  id: string
  title: string
  column: TaskColumn
  order: number
  linkType: TaskLinkType
  linkId: string | null
  createdAt?: string
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

const COLUMNS: {
  key: TaskColumn
  title: string
  shortTitle: string
  dot: string
  accentBorder: string
  emptyLabel: string
}[] = [
  { key: 'backlog', title: 'Backlog', shortTitle: 'Backlog', dot: 'bg-zinc-400', accentBorder: 'border-l-zinc-400', emptyLabel: 'Sin tareas pendientes de definir' },
  { key: 'todo', title: 'Por hacer', shortTitle: 'Por hacer', dot: 'bg-amber-500', accentBorder: 'border-l-amber-500', emptyLabel: 'Nada por hacer todavía' },
  { key: 'doing', title: 'En proceso', shortTitle: 'En curso', dot: 'bg-blue-500', accentBorder: 'border-l-blue-500', emptyLabel: 'Nada en curso' },
  { key: 'done', title: 'Terminado', shortTitle: 'Listo', dot: 'bg-emerald-500', accentBorder: 'border-l-emerald-500', emptyLabel: 'Todavía no se cerró nada' },
]

const LINK_META: Record<
  NonNullable<TaskLinkType>,
  { label: string; icon: React.ElementType; className: string }
> = {
  budget: { label: 'Presupuesto', icon: FileText, className: 'bg-slate-100 text-slate-700' },
  receipt: { label: 'Recibo', icon: Receipt, className: 'bg-emerald-100 text-emerald-700' },
  delivery_note: { label: 'Remito', icon: Truck, className: 'bg-blue-100 text-blue-700' },
}

function linkHref(linkType: TaskLinkType, linkId: string | null): string | null {
  if (!linkType || !linkId) return null
  if (linkType === 'budget') return `/budgets/${linkId}`
  if (linkType === 'receipt') return `/api/receipts/${linkId}/pdf`
  if (linkType === 'delivery_note') return `/api/delivery-notes/${linkId}/pdf`
  return null
}

function relativeTime(iso?: string): string | null {
  if (!iso) return null
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'recién'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'ayer'
  if (diffD < 7) return `hace ${diffD} días`
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function TasksBoard() {
  const { data: tasks = [] } = useSWR<Task[]>('/api/tasks', fetcher)
  const [linkPickerTaskId, setLinkPickerTaskId] = useState<string | null>(null)
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0) // 👈 nuevo — columna activa en mobile

  const handleDrop = useCallback(
    async (cardId: string, targetColumn: TaskColumn, beforeId: string | null) => {
      const current = [...tasks]
      const moved = current.find((c) => c.id === cardId)
      if (!moved) return

      const rest = current.filter((c) => c.id !== cardId)
      const columnCards = rest.filter((c) => c.column === targetColumn)
      const otherCards = rest.filter((c) => c.column !== targetColumn)

      let insertIndex = columnCards.length
      if (beforeId) {
        const idx = columnCards.findIndex((c) => c.id === beforeId)
        if (idx !== -1) insertIndex = idx
      }
      columnCards.splice(insertIndex, 0, { ...moved, column: targetColumn })

      const updates = columnCards.map((c, i) => ({ id: c.id, column: targetColumn, order: i }))

      mutate(
        '/api/tasks',
        [...otherCards, ...columnCards.map((c, i) => ({ ...c, order: i }))],
        false
      )

      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      mutate('/api/tasks')
    },
    [tasks]
  )

  // 🌟 nuevo — mover una tarjeta a la columna anterior/siguiente con un tap (mobile)
  const handleMove = useCallback(
    (cardId: string, direction: -1 | 1) => {
      const currentIdx = COLUMNS.findIndex((c) => c.key === tasks.find((t) => t.id === cardId)?.column)
      const targetIdx = currentIdx + direction
      if (targetIdx < 0 || targetIdx >= COLUMNS.length) return
      handleDrop(cardId, COLUMNS[targetIdx].key, null)
    },
    [tasks, handleDrop]
  )

  const handleAdd = useCallback(async (column: TaskColumn, title: string) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, column }),
    })
    mutate('/api/tasks')
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    mutate('/api/tasks')
  }, [])

  const handleLink = useCallback(
    async (linkType: 'budget' | 'receipt' | 'delivery_note', linkId: string) => {
      if (!linkPickerTaskId) return
      await fetch(`/api/tasks/${linkPickerTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkType, linkId }),
      })
      mutate('/api/tasks')
      setLinkPickerTaskId(null)
    },
    [linkPickerTaskId]
  )

  const cardsByColumn = useMemo(() => {
    const map = new Map<TaskColumn, Task[]>()
    for (const col of COLUMNS) {
      map.set(col.key, tasks.filter((t) => t.column === col.key).sort((a, b) => a.order - b.order))
    }
    return map
  }, [tasks])

  const activeColumn = COLUMNS[mobileColumnIndex]

  return (
    <>
      {/* 🖥️ DESKTOP/TABLET: columnas lado a lado con drag & drop nativo */}
      <div className="hidden h-full w-full gap-4 overflow-x-auto pb-4 md:flex">
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            column={col.key}
            title={col.title}
            dot={col.dot}
            accentBorder={col.accentBorder}
            emptyLabel={col.emptyLabel}
            cards={cardsByColumn.get(col.key) ?? []}
            onDrop={handleDrop}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onLinkRequest={setLinkPickerTaskId}
          />
        ))}
      </div>

      {/* 📱 MOBILE: una columna a la vez, con tabs + mover con flechas (sin drag) */}
      <div className="flex h-full flex-col md:hidden">
        {/* Tabs de columnas */}
        <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
          {COLUMNS.map((col, idx) => (
            <button
              key={col.key}
              type="button"
              onClick={() => setMobileColumnIndex(idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                idx === mobileColumnIndex
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
              {col.shortTitle}
              <span className="text-[10px] text-muted-foreground/70">
                {cardsByColumn.get(col.key)?.length ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Cards de la columna activa, full width */}
        <MobileColumnCards
          column={activeColumn.key}
          accentBorder={activeColumn.accentBorder}
          emptyLabel={activeColumn.emptyLabel}
          cards={cardsByColumn.get(activeColumn.key) ?? []}
          canMoveLeft={mobileColumnIndex > 0}
          canMoveRight={mobileColumnIndex < COLUMNS.length - 1}
          onMove={handleMove}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onLinkRequest={setLinkPickerTaskId}
        />
      </div>

      <LinkPickerModal
        open={linkPickerTaskId !== null}
        onOpenChange={(o) => !o && setLinkPickerTaskId(null)}
        onSelect={(linkType, linkId) => handleLink(linkType, linkId)}
      />
    </>
  )
}

/* =========================================================
   Contenido compartido de una tarjeta (usado por desktop y mobile,
   para no duplicar el markup de link/fecha/eliminar dos veces)
   ========================================================= */
function TaskCardBody({
  card, onDelete, onLinkRequest,
}: {
  card: Task
  onDelete: (id: string) => void
  onLinkRequest: (id: string) => void
}) {
  const href = linkHref(card.linkType, card.linkId)
  const linkMeta = card.linkType ? LINK_META[card.linkType] : null
  const time = relativeTime(card.createdAt)

  return (
    <div className="mt-2.5 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {href && linkMeta ? (
          <a
            href={href}
            target={card.linkType === 'budget' ? '_self' : '_blank'}
            rel="noreferrer"
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80 ${linkMeta.className}`}
          >
            <linkMeta.icon className="h-2.5 w-2.5" />
            {linkMeta.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onLinkRequest(card.id)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
          >
            <Link2 className="h-2.5 w-2.5" /> Vincular
          </button>
        )}
        {time && <span className="shrink-0 text-[10px] text-muted-foreground/70">{time}</span>}
      </div>

      <button
        type="button"
        onClick={() => onDelete(card.id)}
        className="shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:!text-destructive md:text-muted-foreground/0 md:group-hover:text-muted-foreground/60"
      >
        <Trash className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* =========================================================
   MOBILE — lista de cards de una columna, con flechas de mover
   ========================================================= */
function MobileColumnCards({
  column, accentBorder, emptyLabel, cards, canMoveLeft, canMoveRight, onMove, onAdd, onDelete, onLinkRequest,
}: {
  column: TaskColumn
  accentBorder: string
  emptyLabel: string
  cards: Task[]
  canMoveLeft: boolean
  canMoveRight: boolean
  onMove: (cardId: string, direction: -1 | 1) => void
  onAdd: (column: TaskColumn, title: string) => void
  onDelete: (id: string) => void
  onLinkRequest: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(column, text.trim())
    setText('')
    setAdding(false)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-2">
      <AnimatePresence initial={false}>
        {cards.map((card) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`mb-2 overflow-hidden rounded-lg border border-l-[3px] ${accentBorder} border-border bg-card shadow-sm`}
          >
            <div className="p-3">
              <p className="text-sm leading-snug text-card-foreground">{card.title}</p>
              <TaskCardBody card={card} onDelete={onDelete} onLinkRequest={onLinkRequest} />

              {/* Flechas para mover de columna — reemplazan al drag en touch */}
              <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
                <button
                  type="button"
                  disabled={!canMoveLeft}
                  onClick={() => onMove(card.id, -1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium text-muted-foreground disabled:opacity-30 active:bg-muted"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
                <button
                  type="button"
                  disabled={!canMoveRight}
                  onClick={() => onMove(card.id, 1)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium text-muted-foreground disabled:opacity-30 active:bg-muted"
                >
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {cards.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-10 text-center">
          <Inbox className="h-4 w-4 text-muted-foreground/40" />
          <p className="px-6 text-xs text-muted-foreground/70">{emptyLabel}</p>
        </div>
      )}

      {adding ? (
        <form onSubmit={submitAdd} className="space-y-1.5">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nueva tarea..."
            className="w-full rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm outline-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 text-xs">
            <button type="button" onClick={() => { setAdding(false); setText('') }} className="px-2 py-1.5 text-muted-foreground">
              Cancelar
            </button>
            <button type="submit" className="rounded bg-foreground px-3 py-1.5 text-background">
              Agregar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground active:bg-muted/50"
        >
          <Plus className="h-4 w-4" /> Agregar tarjeta
        </button>
      )}
    </div>
  )
}

/* =========================================================
   DESKTOP — columna con drag & drop nativo (sin cambios de comportamiento)
   ========================================================= */
function Column({
  title, dot, accentBorder, emptyLabel, column, cards, onDrop, onAdd, onDelete, onLinkRequest,
}: {
  title: string
  dot: string
  accentBorder: string
  emptyLabel: string
  column: TaskColumn
  cards: Task[]
  onDrop: (cardId: string, column: TaskColumn, beforeId: string | null) => void
  onAdd: (column: TaskColumn, title: string) => void
  onDelete: (id: string) => void
  onLinkRequest: (taskId: string) => void
}) {
  const [active, setActive] = useState(false)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setActive(true)
  }
  const handleDragLeave = () => setActive(false)

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault()
    setActive(false)
    const cardId = e.dataTransfer.getData('cardId')
    onDrop(cardId, column, null)
  }

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(column, text.trim())
    setText('')
    setAdding(false)
  }

  return (
    <div className="w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
            {cards.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Agregar tarjeta"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        onDrop={handleDropEvent}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`min-h-[240px] rounded-xl p-1.5 transition-colors ${
          active ? 'bg-muted/70 ring-2 ring-inset ring-primary/20' : ''
        }`}
      >
        <AnimatePresence initial={false}>
          {cards.map((card) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData('cardId', card.id)}
            >
              <motion.div
                layout
                layoutId={card.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`group mb-2 cursor-grab overflow-hidden rounded-lg border border-l-[3px] ${accentBorder} border-border bg-card shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing`}
              >
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60" />
                    <p className="flex-1 text-sm leading-snug text-card-foreground">{card.title}</p>
                  </div>
                  <div className="pl-5">
                    <TaskCardBody card={card} onDelete={onDelete} onLinkRequest={onLinkRequest} />
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {cards.length === 0 && !adding && (
          <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-center">
            <Inbox className="h-4 w-4 text-muted-foreground/40" />
            <p className="px-4 text-[11px] text-muted-foreground/70">{emptyLabel}</p>
          </div>
        )}

        {adding ? (
          <form onSubmit={submitAdd} className="space-y-1.5">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAdding(false)
                  setText('')
                }
              }}
              placeholder="Nueva tarea..."
              className="w-full rounded-lg border border-primary/40 bg-primary/5 p-2 text-sm outline-none"
              rows={2}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button type="button" onClick={() => { setAdding(false); setText('') }} className="text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
              <button type="submit" className="rounded bg-foreground px-2 py-1 text-background">
                Agregar
              </button>
            </div>
          </form>
        ) : cards.length > 0 ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar tarjeta
          </button>
        ) : null}
      </div>
    </div>
  )
}