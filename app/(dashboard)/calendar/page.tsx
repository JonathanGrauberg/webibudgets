'use client'
// app/(dashboard)/calendar/page.tsx
//
// Calendario/agenda COMPARTIDA de la empresa (no personal por usuario) —
// cualquiera con acceso al sistema la ve. Pueden crear anotaciones Owner,
// Admin y Vendedor; cada quien solo edita/borra lo suyo (ni siquiera otro
// admin puede tocar la anotación de otro — a propósito). Se colorea por
// rol del autor (admin vs. vendedor) para distinguir de un vistazo.
//
// El toggle "Ver info de .budgets" superpone (de solo lectura, sin poder
// borrarse desde acá) los vencimientos de presupuestos y las fechas de
// cobro que ya existen en el sistema — ver app/api/calendar-events/overlay.

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Info } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface CalendarEventDTO {
  id: string
  title: string
  notes: string | null
  date: string
  time: string | null
  createdByUserId: string
  authorName: string
  authorRole: 'admin' | 'seller'
}

interface OverlayItem {
  id: string
  type: string
  date: string
  title: string
  href: string
}

const OVERLAY_KEY = 'calendar-show-overlay'

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export default function CalendarPage() {
  const { role, userId, canEdit } = usePermissions()
  const canCreate = canEdit('calendar')
  const canClearAll = role === 'owner' || role === 'admin'

  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()))
  const [showOverlay, setShowOverlay] = useState(false)
  const [dialogState, setDialogState] = useState<{ mode: 'create' | 'edit'; date?: Date; event?: CalendarEventDTO } | null>(null)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    try {
      setShowOverlay(localStorage.getItem(OVERLAY_KEY) === 'true')
    } catch {}
  }, [])

  function toggleOverlay(checked: boolean) {
    setShowOverlay(checked)
    try {
      localStorage.setItem(OVERLAY_KEY, String(checked))
    } catch {}
  }

  const monthStart = startOfMonth(monthAnchor)
  const monthEnd = endOfMonth(monthAnchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd])

  const eventsKey = `/api/calendar-events?from=${gridStart.toISOString()}&to=${gridEnd.toISOString()}`
  const { data: events, mutate } = useSWR<CalendarEventDTO[]>(eventsKey, fetcher)

  const overlayKey = showOverlay ? `/api/calendar-events/overlay?from=${gridStart.toISOString()}&to=${gridEnd.toISOString()}` : null
  const { data: overlayItems } = useSWR<OverlayItem[]>(overlayKey, fetcher)

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventDTO[]>()
    for (const e of events ?? []) {
      const key = dayKey(e.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [events])

  const overlayByDay = useMemo(() => {
    const map = new Map<string, OverlayItem[]>()
    for (const it of overlayItems ?? []) {
      const key = dayKey(it.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return map
  }, [overlayItems])

  async function handleClearAll() {
    if (!confirm('¿Vaciar TODO el calendario? Se borran las anotaciones de TODO el equipo, no solo las tuyas — y no se puede deshacer.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/calendar-events/clear', { method: 'DELETE' })
      if (!res.ok) {
        toast.error('No se pudo vaciar el calendario')
        return
      }
      toast.success('Calendario vaciado')
      mutate()
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      <PageHeader title="Calendario" description="Agenda compartida de la empresa — todos ven lo mismo">
        {canClearAll && (
          <Button variant="outline" size="sm" disabled={clearing} onClick={handleClearAll} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Vaciar calendario
          </Button>
        )}
      </PageHeader>

      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMonthAnchor((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-semibold capitalize">
              {format(monthAnchor, 'MMMM yyyy', { locale: es })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setMonthAnchor((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMonthAnchor(startOfMonth(new Date()))}>
              Hoy
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={showOverlay} onCheckedChange={toggleOverlay} />
              Ver info de .budgets
            </label>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Admin</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Vendedor</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDay.get(key) ?? []
              const dayOverlay = overlayByDay.get(key) ?? []
              const inMonth = isSameMonth(day, monthStart)
              const today = isToday(day)

              return (
                <div
                  key={key}
                  onClick={() => canCreate && setDialogState({ mode: 'create', date: day })}
                  className={`min-h-[110px] border-b border-r border-slate-100 p-1.5 dark:border-slate-800 ${
                    inMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-950/40'
                  } ${canCreate ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        today ? 'bg-primary font-semibold text-primary-foreground' : inMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setDialogState({ mode: 'edit', event: e })
                        }}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${
                          e.authorRole === 'admin'
                            ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                        title={`${e.title} — ${e.authorName}`}
                      >
                        {e.time ? `${e.time} ` : ''}{e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} más</p>
                    )}
                    {dayOverlay.map((it) => (
                      <a
                        key={it.id}
                        href={it.href}
                        onClick={(ev) => ev.stopPropagation()}
                        className="flex items-center gap-1 truncate rounded border border-dashed border-slate-300 px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40"
                        title={it.title}
                      >
                        <Info className="h-2.5 w-2.5 shrink-0" /> {it.title}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {!canCreate && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Podés ver el calendario, pero solo Admin y Vendedores pueden agregar anotaciones.
          </p>
        )}
      </div>

      <EventDialog
        state={dialogState}
        currentUserId={userId}
        onClose={() => setDialogState(null)}
        onSaved={() => {
          setDialogState(null)
          mutate()
        }}
      />
    </div>
  )
}

function EventDialog({
  state,
  currentUserId,
  onClose,
  onSaved,
}: {
  state: { mode: 'create' | 'edit'; date?: Date; event?: CalendarEventDTO } | null
  currentUserId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!state) return
    if (state.mode === 'edit' && state.event) {
      setTitle(state.event.title)
      setNotes(state.event.notes ?? '')
      setTime(state.event.time ?? '')
    } else {
      setTitle('')
      setNotes('')
      setTime('')
    }
  }, [state])

  if (!state) return null

  const isOwnEvent = state.mode === 'create' || state.event?.createdByUserId === currentUserId
  const dateForCreate = state.date ?? new Date()

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Falta el título')
      return
    }
    setSaving(true)
    try {
      if (state!.mode === 'create') {
        const res = await fetch('/api/calendar-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), notes: notes.trim() || null, date: dateForCreate.toISOString(), time: time || null }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          toast.error(json?.error ?? 'No se pudo crear la anotación')
          return
        }
        toast.success('Anotación creada')
      } else {
        const res = await fetch(`/api/calendar-events/${state!.event!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), notes: notes.trim() || null, time: time || null }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          toast.error(json?.error ?? 'No se pudo guardar')
          return
        }
        toast.success('Guardado')
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!state!.event) return
    if (!confirm('¿Borrar esta anotación?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/calendar-events/${state!.event.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error ?? 'No se pudo borrar')
        return
      }
      toast.success('Borrado')
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {state.mode === 'create'
              ? `Nueva anotación — ${format(dateForCreate, "d 'de' MMMM", { locale: es })}`
              : format(new Date(state.event!.date), "EEEE d 'de' MMMM", { locale: es })}
          </DialogTitle>
        </DialogHeader>

        {isOwnEvent ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Junta de equipo" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hora (opcional)</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
              {state.mode === 'edit' ? (
                <Button variant="outline" size="sm" disabled={saving} onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Borrar
                </Button>
              ) : <span />}
              <Button size="sm" disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{state.event?.title}</p>
            {state.event?.time && <p className="text-xs text-muted-foreground">Hora: {state.event.time}</p>}
            {state.event?.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.event.notes}</p>}
            <p className="pt-1 text-xs text-muted-foreground">
              Anotado por <span className="font-medium text-foreground">{state.event?.authorName}</span> — solo esa persona puede editarla o borrarla.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
