'use client'
//components\tasks\tasks-board.tsx
import React, { useState, useCallback, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash, Link2, FileText, Receipt, Truck, GripVertical, Inbox,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react'
import { LinkPickerModal } from './link-picker-modal'

type TaskColumn = 'backlog' | 'todo' | 'doing' | 'done'
type TaskLinkType = 'budget' | 'receipt' | 'delivery_note' | null
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

type Task = {
  id: string
  title: string
  column: TaskColumn
  order: number
  linkType: TaskLinkType
  linkId: string | null
  createdAt?: string
  priority?: TaskPriority
  kioskBoardId?: string | null
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

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'low', label: 'Baja', dot: 'bg-zinc-300' },
  { value: 'medium', label: 'Media', dot: 'bg-blue-400' },
  { value: 'high', label: 'Alta', dot: 'bg-red-400' },
  { value: 'urgent', label: 'Urgente', dot: 'bg-red-600' },
]

// 👇 nuevo — mapeo de prioridad a color de borde, ahora los 4 niveles se ven
const PRIORITY_BORDER: Record<TaskPriority, string> = {
  low: 'border-l-zinc-300',
  medium: 'border-l-blue-400',
  high: 'border-l-red-400',
  urgent: 'border-l-red-600',
}

function borderForCard(task: Task, columnAccent: string): string {
  if (!task.priority) return columnAccent // sin prioridad cargada (tareas viejas) → color de columna, como antes
  return PRIORITY_BORDER[task.priority] ?? columnAccent
}

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

interface TasksBoardProps {
  boardId?: string | null
  canEdit?: boolean
  large?: boolean // 👈 nuevo — modo táctil grande, se activa solo desde /kiosco
}

export function TasksBoard({ boardId = null, canEdit = true, large = false }: TasksBoardProps) {
  const swrKey = boardId ? `/api/tasks?kioskBoardId=${boardId}` : '/api/tasks'
  const { data: tasks = [] } = useSWR<Task[]>(swrKey, fetcher)
  const [linkPickerTaskId, setLinkPickerTaskId] = useState<string | null>(null)
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0)

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
        swrKey,
        [...otherCards, ...columnCards.map((c, i) => ({ ...c, order: i }))],
        false
      )

      await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      mutate(swrKey)
    },
    [tasks, swrKey]
  )

  const handleMove = useCallback(
    (cardId: string, direction: -1 | 1) => {
      const currentIdx = COLUMNS.findIndex((c) => c.key === tasks.find((t) => t.id === cardId)?.column)
      const targetIdx = currentIdx + direction
      if (targetIdx < 0 || targetIdx >= COLUMNS.length) return
      handleDrop(cardId, COLUMNS[targetIdx].key, null)
    },
    [tasks, handleDrop]
  )

  const handleAdd = useCallback(async (column: TaskColumn, title: string, priority: TaskPriority) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, column, priority, kioskBoardId: boardId }),
    })
    mutate(swrKey)
  }, [swrKey, boardId])

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    mutate(swrKey)
  }, [swrKey])

  const handleLink = useCallback(
    async (linkType: 'budget' | 'receipt' | 'delivery_note', linkId: string) => {
      if (!linkPickerTaskId) return
      await fetch(`/api/tasks/${linkPickerTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkType, linkId }),
      })
      mutate(swrKey)
      setLinkPickerTaskId(null)
    },
    [linkPickerTaskId, swrKey]
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
      <div className={`hidden h-full w-full overflow-x-auto pb-4 md:flex ${large ? 'gap-6' : 'gap-4'}`}>
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            column={col.key}
            title={col.title}
            dot={col.dot}
            accentBorder={col.accentBorder}
            emptyLabel={col.emptyLabel}
            cards={cardsByColumn.get(col.key) ?? []}
            canEdit={canEdit}
            large={large}
            onDrop={handleDrop}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onLinkRequest={setLinkPickerTaskId}
          />
        ))}
      </div>

      {/* 📱 MOBILE: una columna a la vez, con tabs + mover con flechas (sin drag) */}
      <div className="flex h-full flex-col md:hidden">
        <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
          {COLUMNS.map((col, idx) => (
            <button
              key={col.key}
              type="button"
              onClick={() => setMobileColumnIndex(idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition-colors ${
                large ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-xs'
              } ${
                idx === mobileColumnIndex
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <span className={`rounded-full ${large ? 'h-2 w-2' : 'h-1.5 w-1.5'} ${col.dot}`} />
              {col.shortTitle}
              <span className="text-[10px] text-muted-foreground/70">
                {cardsByColumn.get(col.key)?.length ?? 0}
              </span>
            </button>
          ))}
        </div>

        <MobileColumnCards
          column={activeColumn.key}
          accentBorder={activeColumn.accentBorder}
          emptyLabel={activeColumn.emptyLabel}
          cards={cardsByColumn.get(activeColumn.key) ?? []}
          canMoveLeft={mobileColumnIndex > 0}
          canMoveRight={mobileColumnIndex < COLUMNS.length - 1}
          canEdit={canEdit}
          large={large}
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
   Selector chico de prioridad — 4 puntitos
   ========================================================= */
function PrioritySelector({ value, onChange, large }: { value: TaskPriority; onChange: (p: TaskPriority) => void; large?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {PRIORITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.label}
          className={`flex items-center justify-center rounded-full border transition-all ${
            large ? 'h-9 w-9' : 'h-6 w-6'
          } ${
            value === opt.value ? 'border-foreground scale-110' : 'border-transparent opacity-50'
          }`}
        >
          <span className={`rounded-full ${large ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'} ${opt.dot}`} />
        </button>
      ))}
    </div>
  )
}

/* =========================================================
   Contenido compartido de una tarjeta
   ========================================================= */
function TaskCardBody({
  card, canEdit, large, onDelete, onLinkRequest,
}: {
  card: Task
  canEdit: boolean
  large?: boolean
  onDelete: (id: string) => void
  onLinkRequest: (id: string) => void
}) {
  const href = linkHref(card.linkType, card.linkId)
  const linkMeta = card.linkType ? LINK_META[card.linkType] : null
  const time = relativeTime(card.createdAt)

  return (
    <div className={`flex items-center justify-between gap-2 ${large ? 'mt-4' : 'mt-2.5'}`}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {href && linkMeta ? (
          <a
            href={href}
            target={card.linkType === 'budget' ? '_self' : '_blank'}
            rel="noreferrer"
            className={`inline-flex items-center gap-1 rounded-full font-medium transition-opacity hover:opacity-80 ${linkMeta.className} ${
              large ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
            }`}
          >
            <linkMeta.icon className={large ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'} />
            {linkMeta.label}
          </a>
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => onLinkRequest(card.id)}
            className={`inline-flex items-center gap-1 rounded-full font-medium text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground ${
              large ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px] md:opacity-0 md:group-hover:opacity-100'
            }`}
          >
            <Link2 className={large ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'} /> Vincular
          </button>
        ) : null}
        {(card.priority === 'high' || card.priority === 'urgent') && (
          <span className={`inline-flex items-center gap-0.5 rounded-full bg-red-50 font-semibold text-red-600 ${
            large ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
          }`}>
            <AlertTriangle className={large ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'} />
            {card.priority === 'urgent' ? 'Urgente' : 'Alta'}
          </span>
        )}
        {time && <span className={`shrink-0 text-muted-foreground/70 ${large ? 'text-xs' : 'text-[10px]'}`}>{time}</span>}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className={`shrink-0 rounded text-muted-foreground/60 transition-colors hover:!text-destructive ${
            large ? 'p-1.5' : 'p-0.5 md:text-muted-foreground/0 md:group-hover:text-muted-foreground/60'
          }`}
        >
          <Trash className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </div>
  )
}

/* =========================================================
   MOBILE — lista de cards de una columna, con flechas de mover
   ========================================================= */
function MobileColumnCards({
  column, accentBorder, emptyLabel, cards, canMoveLeft, canMoveRight, canEdit, large, onMove, onAdd, onDelete, onLinkRequest,
}: {
  column: TaskColumn
  accentBorder: string
  emptyLabel: string
  cards: Task[]
  canMoveLeft: boolean
  canMoveRight: boolean
  canEdit: boolean
  large?: boolean
  onMove: (cardId: string, direction: -1 | 1) => void
  onAdd: (column: TaskColumn, title: string, priority: TaskPriority) => void
  onDelete: (id: string) => void
  onLinkRequest: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(column, text.trim(), priority)
    setText('')
    setPriority('medium')
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
            className={`mb-3 overflow-hidden rounded-lg border border-l-[3px] ${borderForCard(card, accentBorder)} border-border bg-card shadow-sm`}
          >
            <div className={large ? 'p-4' : 'p-3'}>
              <p className={`leading-snug text-card-foreground ${large ? 'text-base' : 'text-sm'}`}>{card.title}</p>
              <TaskCardBody card={card} canEdit={canEdit} large={large} onDelete={onDelete} onLinkRequest={onLinkRequest} />

              <div className={`flex items-center gap-2 border-t border-border ${large ? 'mt-4 pt-4' : 'mt-2.5 pt-2.5'}`}>
                <button
                  type="button"
                  disabled={!canMoveLeft}
                  onClick={() => onMove(card.id, -1)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md font-medium text-muted-foreground disabled:opacity-30 active:bg-muted ${
                    large ? 'py-3 text-sm' : 'py-1.5 text-[11px]'
                  }`}
                >
                  <ChevronLeft className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} /> Anterior
                </button>
                <button
                  type="button"
                  disabled={!canMoveRight}
                  onClick={() => onMove(card.id, 1)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md font-medium text-muted-foreground disabled:opacity-30 active:bg-muted ${
                    large ? 'py-3 text-sm' : 'py-1.5 text-[11px]'
                  }`}
                >
                  Siguiente <ChevronRight className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {cards.length === 0 && !adding && (
        <div className={`flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border text-center ${large ? 'py-14' : 'py-10'}`}>
          <Inbox className={`text-muted-foreground/40 ${large ? 'h-6 w-6' : 'h-4 w-4'}`} />
          <p className={`px-6 text-muted-foreground/70 ${large ? 'text-sm' : 'text-xs'}`}>{emptyLabel}</p>
        </div>
      )}

      {canEdit && (
        adding ? (
          <form onSubmit={submitAdd} className="space-y-2">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nueva tarea..."
              className={`w-full rounded-lg border border-primary/40 bg-primary/5 outline-none ${large ? 'p-4 text-base' : 'p-3 text-sm'}`}
              rows={2}
            />
            <div className="flex items-center justify-between">
              <PrioritySelector value={priority} onChange={setPriority} large={large} />
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => { setAdding(false); setText('') }} className={`text-muted-foreground ${large ? 'px-3 py-2.5 text-sm' : 'px-2 py-1.5'}`}>
                  Cancelar
                </button>
                <button type="submit" className={`rounded bg-foreground text-background ${large ? 'px-4 py-2.5 text-sm' : 'px-3 py-1.5'}`}>
                  Agregar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground active:bg-muted/50 ${
              large ? 'py-5 text-base' : 'py-3 text-sm'
            }`}
          >
            <Plus className={large ? 'h-5 w-5' : 'h-4 w-4'} /> Agregar tarjeta
          </button>
        )
      )}
    </div>
  )
}

/* =========================================================
   DESKTOP — columna con drag & drop nativo
   ========================================================= */
function Column({
  title, dot, accentBorder, emptyLabel, column, cards, canEdit, large, onDrop, onAdd, onDelete, onLinkRequest,
}: {
  title: string
  dot: string
  accentBorder: string
  emptyLabel: string
  column: TaskColumn
  cards: Task[]
  canEdit: boolean
  large?: boolean
  onDrop: (cardId: string, column: TaskColumn, beforeId: string | null) => void
  onAdd: (column: TaskColumn, title: string, priority: TaskPriority) => void
  onDelete: (id: string) => void
  onLinkRequest: (taskId: string) => void
}) {
  const [active, setActive] = useState(false)
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

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
    onAdd(column, text.trim(), priority)
    setText('')
    setPriority('medium')
    setAdding(false)
  }

  return (
    <div className={`shrink-0 ${large ? 'w-80' : 'w-72'}`}>
      <div className={`flex items-center justify-between ${large ? 'mb-4' : 'mb-3'}`}>
        <div className="flex items-center gap-2">
          <span className={`rounded-full ${large ? 'h-3 w-3' : 'h-2 w-2'} ${dot}`} />
          <h3 className={`font-semibold text-foreground ${large ? 'text-base' : 'text-sm'}`}>{title}</h3>
          <span className={`rounded-full bg-muted font-medium text-muted-foreground ${large ? 'px-2 py-0.5 text-sm' : 'px-1.5 text-[11px]'}`}>
            {cards.length}
          </span>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${large ? 'p-2' : 'p-1'}`}
            title="Agregar tarjeta"
          >
            <Plus className={large ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
          </button>
        )}
      </div>

      <div
        onDrop={handleDropEvent}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-xl transition-colors ${large ? 'min-h-[300px] p-2' : 'min-h-[240px] p-1.5'} ${
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
                className={`group cursor-grab overflow-hidden rounded-lg border border-l-[3px] ${borderForCard(card, accentBorder)} border-border bg-card shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${large ? 'mb-3' : 'mb-2'}`}
              >
                <div className={large ? 'p-4' : 'p-3'}>
                  <div className="flex items-start gap-2">
                    <GripVertical className={`mt-0.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 ${large ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                    <p className={`flex-1 leading-snug text-card-foreground ${large ? 'text-base' : 'text-sm'}`}>{card.title}</p>
                  </div>
                  <div className={large ? 'pl-6' : 'pl-5'}>
                    <TaskCardBody card={card} canEdit={canEdit} large={large} onDelete={onDelete} onLinkRequest={onLinkRequest} />
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {cards.length === 0 && !adding && (
          <div className={`flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border text-center ${large ? 'py-12' : 'py-8'}`}>
            <Inbox className={`text-muted-foreground/40 ${large ? 'h-5 w-5' : 'h-4 w-4'}`} />
            <p className={`px-4 text-muted-foreground/70 ${large ? 'text-sm' : 'text-[11px]'}`}>{emptyLabel}</p>
          </div>
        )}

        {canEdit && (
          adding ? (
            <form onSubmit={submitAdd} className="space-y-2">
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
                className={`w-full rounded-lg border border-primary/40 bg-primary/5 outline-none ${large ? 'p-3 text-base' : 'p-2 text-sm'}`}
                rows={2}
              />
              <div className="flex items-center justify-between">
                <PrioritySelector value={priority} onChange={setPriority} large={large} />
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => { setAdding(false); setText('') }} className={`text-muted-foreground hover:text-foreground ${large ? 'px-2 py-1.5 text-sm' : ''}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`rounded bg-foreground text-background ${large ? 'px-3 py-1.5 text-sm' : 'px-2 py-1'}`}>
                    Agregar
                  </button>
                </div>
              </div>
            </form>
          ) : cards.length > 0 ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={`flex w-full items-center gap-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground ${large ? 'px-3 py-3 text-sm' : 'px-2 py-1.5 text-xs'}`}
            >
              <Plus className={large ? 'h-4 w-4' : 'h-3.5 w-3.5'} /> Agregar tarjeta
            </button>
          ) : null
        )}
      </div>
    </div>
  )
}