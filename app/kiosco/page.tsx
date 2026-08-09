'use client'
// app/(dashboard)/kiosco/page.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom' // 👈 nuevo
import { useSession } from 'next-auth/react'
import useSWR, { mutate } from 'swr'
import { Plus, X, Crown, LayoutGrid, Pointer, MoreVertical, AlertTriangle, VolumeX } from 'lucide-react'
import { TasksBoard } from '@/components/tasks/tasks-board'
import { hasFeature } from '@/lib/features'
import { motion } from 'framer-motion'

const MANAGER_ROLES = ['owner', 'admin']
const EMPTY_BOARDS: KioskBoard[] = [] // 👈 nuevo — referencia estable, evita bucle infinito cuando data está undefined

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' // 👈 nuevo — mismo enum que en tasks-board

type KioskBoard = {
  id: string
  name: string
  order: number
  priority?: TaskPriority // 👈 nuevo
}

const BOARD_PRIORITY_OPTIONS: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'low', label: 'Baja', dot: 'bg-zinc-300' },
  { value: 'medium', label: 'Media', dot: 'bg-blue-400' },
  { value: 'high', label: 'Alta', dot: 'bg-red-400' },
  { value: 'urgent', label: 'Urgente', dot: 'bg-red-600' },
]

// 👇 nuevo — ring de color por nivel, no solo alta/urgente
const BOARD_PRIORITY_RING: Record<TaskPriority, string> = {
  low: 'ring-2 ring-zinc-300',
  medium: 'ring-2 ring-blue-300',
  high: 'ring-2 ring-red-300',
  urgent: 'animate-pulse ring-2 ring-red-500',
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

// Fallback — círculos genéricos, se usa solo si el tenant no cargó logo
function TouchIcon({ className = '' }: { className?: string }) {
  const GOLD = '#fcc107'
  const BLACK = '#000000'

  const circles = [
    { r: 22, delay: 0 },
    { r: 36, delay: 0.35 },
    { r: 50, delay: 0.7 },
  ]

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full">
        {circles.map(({ r, delay }, i) => (
          <motion.circle
            key={i}
            cx={70}
            cy={70}
            r={r}
            fill="none"
            strokeWidth={6}
            initial={{ opacity: 0.15, stroke: GOLD }}
            animate={{
              opacity: [0.15, 1, 0.15],
              stroke: [GOLD, BLACK, GOLD],
              scale: [0.85, 1.05, 0.85],
            }}
            transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeInOut' }}
            style={{ transformOrigin: '70px 70px' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Pointer className="h-1/3 w-1/3 text-white" strokeWidth={2} />
      </div>
    </div>
  )
}

// 👇 nuevo — el logo del tenant como centro del "toque": ondas con su misma forma
// redondeada saliendo del borde, y una mano chica tocando la esquina.
function LogoTouchPoint({ logoUrl, name }: { logoUrl: string; name?: string | null }) {
  const GOLD = '#fcc107'
  const BLACK = '#000000'
  const ripples = [0, 0.55, 1.1]

  return (
    <div className="relative flex h-40 w-56 items-center justify-center">
      {ripples.map((delay, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-2xl border-[3px]"
          initial={{ opacity: 0.6, scale: 1, borderColor: GOLD }}
          animate={{
            opacity: [0.6, 0],
            scale: [1, 1.35],
            borderColor: [GOLD, BLACK],
          }}
          transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }}
        />
      ))}

      {/* Logo, tarjeta blanca */}
      <div className="relative z-10 flex h-28 w-44 items-center justify-center rounded-2xl bg-white p-4 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name ?? 'Logo'} className="max-h-full max-w-full object-contain" />
      </div>

      {/* Mano chica, tocando la esquina del logo */}
      <Pointer className="absolute bottom-1 right-2 z-20 h-8 w-8 text-white drop-shadow-lg" strokeWidth={2} />
    </div>
  )
}

export default function KioskPage() {
  const { data: session } = useSession()
  const canManageBoards = MANAGER_ROLES.includes(session?.user?.role as string)

  const { data: branding } = useSWR('/api/tenants', fetcher)
  const hasKioskFeature = hasFeature({ plan: branding?.plan, features: branding?.features }, 'kiosk')

  const { data: boards = EMPTY_BOARDS, isLoading } = useSWR<KioskBoard[]>(
    hasKioskFeature ? '/api/kiosk-boards' : null,
    fetcher,
    { refreshInterval: 8000 } // 👈 nuevo — los tableros cambian menos seguido que las tareas, intervalo más largo
  )

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const currentBoardId = activeBoardId ?? boards[0]?.id ?? null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/kiosk-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error('No se pudo crear el tablero')
      const board = await res.json()
      await mutate('/api/kiosk-boards')
      setActiveBoardId(board.id)
      setNewName('')
      setCreating(false)
    } catch (err) {
      console.error(err)
      alert('Error al crear el tablero')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (boardId: string) => {
    if (!confirm('¿Eliminar este tablero? Las tareas quedan sueltas, no se borran.')) return
    await fetch(`/api/kiosk-boards/${boardId}`, { method: 'DELETE' })
    if (activeBoardId === boardId) setActiveBoardId(null)
    mutate('/api/kiosk-boards')
  }

  // 👇 nuevo — prioridad del tablero completo (no de una tarea puntual)
  // El menú se renderiza vía portal (document.body) para no quedar recortado
  // por el overflow-x-auto de la fila de solapas cuando el tablero está scrolleado.
  const [menuAnchor, setMenuAnchor] = useState<{ boardId: string; left: number; bottom: number } | null>(null)

  const openBoardMenu = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (menuAnchor?.boardId === boardId) {
      setMenuAnchor(null)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuAnchor({
      boardId,
      left: Math.min(rect.left, window.innerWidth - 190), // 👈 evita que se salga por la derecha
      bottom: window.innerHeight - rect.top + 8,
    })
  }

  const handleBoardPriority = async (boardId: string, priority: TaskPriority) => {
    setMenuAnchor(null)
    await fetch(`/api/kiosk-boards/${boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    })
    mutate('/api/kiosk-boards')
  }

  const IDLE_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutos sin tocar nada — bajalo a 10 * 1000 solo para probar

  const [showScreensaver, setShowScreensaver] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 👇 nuevo — AudioContext para los beeps de alarma. Se crea/desbloquea con
  // el primer toque real del usuario (los navegadores no dejan reproducir
  // sonido por código sin un gesto humano previo, sobre todo en iOS).
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playAlertBeep = useCallback(() => {
  const ctx = audioCtxRef.current
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()

  const now = ctx.currentTime
  // Notas: Do5 (523Hz), Mi5 (659Hz), Sol5 (784Hz)
  const notes = [523.25, 659.25, 783.99]

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.08)

    const startTime = now + i * 0.08
    const duration = 0.14

    gain.gain.setValueAtTime(0.001, startTime)
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  })
}, [])

  useEffect(() => {
    const resetTimer = () => {
      setShowScreensaver(false)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => setShowScreensaver(true), IDLE_TIMEOUT_MS)

      // 👇 nuevo — desbloqueo del audio en el primer toque real
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        if (Ctx) audioCtxRef.current = new Ctx()
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    }

    const events = ['touchstart', 'mousedown', 'keydown']
    events.forEach((e) => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [])

  // ── Alarma de tableros urgentes — modal con 3 acciones, en vez de banner ──
  const [urgentBoards, setUrgentBoards] = useState<KioskBoard[]>([])
  const [dismissedBoardIds, setDismissedBoardIds] = useState<Set<string>>(new Set())
  const [snoozedUntil, setSnoozedUntil] = useState<number>(0)
  const [alarmModalOpen, setAlarmModalOpen] = useState(false)
  const previousUrgentIdsRef = useRef<Set<string>>(new Set())
  const chimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Solo cuenta como "activo" lo urgente que no fue marcado como "No mostrar más"
  const activeUrgentBoards = useMemo(
    () => urgentBoards.filter((b) => !dismissedBoardIds.has(b.id)),
    [urgentBoards, dismissedBoardIds]
  )

  // Detecta transiciones a "urgente" (no se dispara de nuevo en cada poll si ya estaba urgente)
  useEffect(() => {
    const currentUrgent = boards.filter((b) => b.priority === 'urgent')
    const currentIds = new Set(currentUrgent.map((b) => b.id))
    const newlyUrgentIds = [...currentIds].filter((id) => !previousUrgentIdsRef.current.has(id))

    setUrgentBoards(currentUrgent)

    if (newlyUrgentIds.length > 0) {
      // un tablero que vuelve a ponerse urgente sale de la lista de "silenciados"
      setDismissedBoardIds((prev) => {
        const next = new Set(prev)
        newlyUrgentIds.forEach((id) => next.delete(id))
        return next
      })
      setSnoozedUntil(0)
      setAlarmModalOpen(true)
      playAlertBeep()
    }
    previousUrgentIdsRef.current = currentIds
  }, [boards, playAlertBeep])

  // Recordatorio periódico cada 60s: suena de nuevo y reabre el modal
  useEffect(() => {
    if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current)
    if (activeUrgentBoards.length === 0) return

    chimeIntervalRef.current = setInterval(() => {
      if (Date.now() > snoozedUntil) {
        playAlertBeep()
        setAlarmModalOpen(true)
      }
    }, 60 * 1000)

    return () => {
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current)
    }
  }, [activeUrgentBoards.length, snoozedUntil, playAlertBeep])

  const showAlarmModal = alarmModalOpen && activeUrgentBoards.length > 0

  const handleDismissAlarm = () => setAlarmModalOpen(false) // vuelve a sonar en el próximo recordatorio (60s)

  const handleMuteAlarm = () => {
    setDismissedBoardIds((prev) => {
      const next = new Set(prev)
      activeUrgentBoards.forEach((b) => next.add(b.id))
      return next
    })
    setAlarmModalOpen(false)
  }

  const handleGoToUrgentBoard = () => {
    if (activeUrgentBoards[0]) setActiveBoardId(activeUrgentBoards[0].id)
    setSnoozedUntil(Date.now() + 5 * 60 * 1000) // ya lo está mirando, no lo satures otra vez en 60s
    setAlarmModalOpen(false)
  }

  // ── Sin feature PRO ──────────────────────────────────────────────
  if (!hasKioskFeature) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 p-6 text-center">
        <Crown className="h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-semibold">Modo Kiosco es una función PRO</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {canManageBoards
            ? 'Pasate a PRO para activar la pantalla de tablet en la pared del taller, con tableros organizados por solapas.'
            : 'Pedile a tu administrador que active el plan PRO para usar esta función.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-center border-b border-border bg-primary py-1.5">
        <span className="text-xs font-black tracking-tighter text-foreground">.budgets</span>
      </div>

      {/* Header simple — agrandado para lectura a distancia */}
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <LayoutGrid className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Kiosco</h1>
        {currentBoardId && (
          <span className="text-lg text-muted-foreground">
            · {boards.find((b) => b.id === currentBoardId)?.name}
          </span>
        )}
      </div>

      {/* Tablero activo */}
      <div className="flex-1 min-h-0 overflow-hidden p-6 md:p-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : boards.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <p className="text-sm">Todavía no hay tableros creados.</p>
            {canManageBoards && (
              <p className="text-xs">Usá el botón "+" de abajo para crear el primero.</p>
            )}
          </div>
        ) : currentBoardId ? (
          <TasksBoard boardId={currentBoardId} canEdit={canManageBoards} large /> // 👈 nuevo — modo táctil grande
        ) : null}
      </div>

      {/* ── Solapas abajo, tipo guía telefónica — agrandadas para tocar fácil ── */}
      <div className="border-t border-border bg-muted/30 px-3 pb-3 pt-1">
        <div className="flex items-end gap-2 overflow-x-auto overflow-y-hidden pl-1 pt-3">
          {boards.map((board) => {
            const isActive = board.id === currentBoardId
            const priorityRing = board.priority ? BOARD_PRIORITY_RING[board.priority] : ''

            return (
              <div
                key={board.id}
                className={`group relative flex shrink-0 items-stretch overflow-hidden rounded-t-xl transition-all ${
                  isActive
                    ? 'bg-card text-card-foreground shadow-[0_-2px_8px_rgba(0,0,0,0.06)]'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                } ${priorityRing}`}
                style={isActive ? { marginBottom: '-1px' } : undefined}
              >
                {/* 👇 botón de seleccionar tablero — separado del de los 3 puntitos, no anidados */}
                <button
                  type="button"
                  onClick={() => setActiveBoardId(board.id)}
                  className="px-6 py-4 text-base font-medium"
                >
                  {board.name}
                </button>
                {canManageBoards && (
                  <button
                    type="button"
                    onClick={(e) => openBoardMenu(board.id, e)}
                    className="flex items-center pl-1 pr-4 hover:bg-black/5"
                  >
                    <MoreVertical className="h-4 w-4 opacity-60" />
                  </button>
                )}
              </div>
            )
          })}

          {canManageBoards && (
            creating ? (
              <form onSubmit={handleCreate} className="flex shrink-0 items-center gap-2 px-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && (setCreating(false), setNewName(''))}
                  placeholder="Nombre del tablero..."
                  className="rounded-lg border border-primary/40 bg-background px-3 py-2.5 text-base outline-none"
                />
                <button
                  type="submit"
                  disabled={isSaving || !newName.trim()}
                  className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewName('') }}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex shrink-0 items-center gap-1 rounded-t-xl px-5 py-4 text-base text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                title="Nuevo tablero"
              >
                <Plus className="h-5 w-5" />
              </button>
            )
          )}
        </div>
      </div>

      {/* 👇 nuevo — menú de prioridad del tablero, vía portal: nunca se recorta por el scroll de la fila de solapas */}
      {menuAnchor && canManageBoards && typeof document !== 'undefined' && createPortal(
        <>
          {/* overlay invisible para cerrar tocando afuera */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setMenuAnchor(null)} />
          <div
            style={{ position: 'fixed', left: menuAnchor.left, bottom: menuAnchor.bottom, zIndex: 9999 }}
            className="w-44 rounded-lg border border-border bg-card p-1 shadow-2xl"
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Prioridad
            </p>
            {BOARD_PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleBoardPriority(menuAnchor.boardId, opt.value)}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => { handleDelete(menuAnchor.boardId); setMenuAnchor(null) }}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
              Eliminar tablero
            </button>
          </div>
        </>,
        document.body
      )}

      {/* 👇 nuevo — modal de alarma, z-index por encima incluso del protector de pantalla */}
      {showAlarmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-7 w-7 animate-pulse text-red-600" />
            </div>
            <p className="mb-1 text-lg font-bold text-zinc-900">¡Tarea urgente!</p>
            <p className="mb-6 text-sm text-zinc-500">
              {activeUrgentBoards.map((b) => b.name).join(', ')}
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoToUrgentBoard}
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Ir al tablero
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDismissAlarm}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Desestimar
                </button>
                <button
                  type="button"
                  onClick={handleMuteAlarm}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  No mostrar más
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScreensaver && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black py-16">
          {/* Franja .budgets arriba, amarillo con texto negro */}
          <div className="rounded-full px-6 py-2" style={{ backgroundColor: '#fcc107' }}>
            <span className="text-2xl font-black tracking-tighter text-black">.budgets</span>
          </div>

          {/* BIENVENIDOS gigante, centrado */}
          <div className="flex flex-col items-center gap-10">
            <p className="text-6xl font-light tracking-[0.2em] text-white sm:text-7xl">
              BIENVENIDOS
            </p>

            {/* 👇 el "toque" ahora es sobre el logo del tenant, si tiene uno cargado */}
            {branding?.logoUrl ? (
              <LogoTouchPoint logoUrl={branding.logoUrl} name={branding.name} />
            ) : (
              <TouchIcon className="h-44 w-44" />
            )}
          </div>

          {/* Crédito, chiquito abajo */}
          <p className="text-[10px] tracking-wide text-white/30">
            Sistema creado por webistudio.net
          </p>
        </div>
      )}
    </div>
  )
}