'use client'
// components/help/floating-help-widget.tsx
//
// Botón de ayuda flotante para el dashboard — SUTIL y ARRASTRABLE a
// propósito (nunca fijo tapando algo). Al abrirse, es un chat guiado por
// botones (sin campo de texto, como un menú de WhatsApp), reusando el
// mismo contenido del manual (lib/help-content.ts) — una sola fuente de
// verdad para /manual, /help y este widget.

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { HelpCircle, X, ArrowLeft, House, PlayCircle } from 'lucide-react'
import { HELP_CATEGORIES } from '@/lib/help-content'

const POSITION_KEY = 'help-widget-position'
const BUTTON_SIZE = 44
const DRAG_THRESHOLD = 6 // px — menos que esto se considera un click, no un arrastre

type Screen =
  | { type: 'root' }
  | { type: 'category'; slug: string }
  | { type: 'article'; categorySlug: string; articleSlug: string }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function defaultPosition() {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  return { x: window.innerWidth - BUTTON_SIZE - 24, y: window.innerHeight - BUTTON_SIZE - 24 }
}

export function FloatingHelpWidget() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  // El tour recorre pantallas de admin (Configuración, Clientes, Productos) —
  // no tiene sentido ofrecérselo a un vendedor o instalador que ni las ve.
  const canRestartTour = role === 'admin' || role === 'owner'

  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState(defaultPosition)
  const [isOpen, setIsOpen] = useState(false)
  const [screens, setScreens] = useState<Screen[]>([{ type: 'root' }])

  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; dragged: boolean } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Cargamos posición guardada (o la calculamos) recién en el cliente, para
  // no desalinear el render del server con el tamaño real de la ventana.
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(POSITION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPosition({
          x: clamp(parsed.x, 0, window.innerWidth - BUTTON_SIZE),
          y: clamp(parsed.y, 0, window.innerHeight - BUTTON_SIZE),
        })
        return
      }
    } catch {}
    setPosition(defaultPosition())
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [screens, isOpen])

  function handlePointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y, dragged: false }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragState.current.dragged = true
    }
    if (dragState.current.dragged) {
      setPosition({
        x: clamp(dragState.current.originX + dx, 0, window.innerWidth - BUTTON_SIZE),
        y: clamp(dragState.current.originY + dy, 0, window.innerHeight - BUTTON_SIZE),
      })
    }
  }

  function handlePointerUp() {
    if (!dragState.current) return
    const wasDragged = dragState.current.dragged
    if (wasDragged) {
      setPosition((pos) => {
        try { localStorage.setItem(POSITION_KEY, JSON.stringify(pos)) } catch {}
        return pos
      })
    } else {
      setIsOpen((v) => !v)
    }
    dragState.current = null
  }

  function resetConversation() {
    setScreens([{ type: 'root' }])
  }

  function restartTour() {
    setIsOpen(false)
    resetConversation()
    window.dispatchEvent(new Event('start-onboarding-tour'))
  }

  function goTo(screen: Screen) {
    setScreens((prev) => [...prev, screen])
  }

  if (!mounted) return null

  // Decide de qué lado se abre el panel para que nunca se salga de la pantalla
  const opensLeft = position.x > window.innerWidth / 2
  const opensUp = position.y > window.innerHeight / 2

  return (
    <div
      className="fixed z-50"
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
    >
      {isOpen && (
        <div
          className="absolute flex h-[480px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          style={{
            [opensLeft ? 'right' : 'left']: 0,
            [opensUp ? 'bottom' : 'top']: BUTTON_SIZE + 10,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-foreground px-4 py-3 text-background">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold">Ayuda de .budgets</span>
            </div>
            <div className="flex items-center gap-1">
              {screens.length > 1 && (
                <button
                  type="button"
                  onClick={resetConversation}
                  className="rounded-lg p-1.5 text-background/70 transition hover:bg-background/10 hover:text-background"
                  aria-label="Volver al menú principal"
                  title="Volver al menú principal"
                >
                  <House className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-background/70 transition hover:bg-background/10 hover:text-background"
                aria-label="Cerrar ayuda"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {screens.length > 1 && (
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
              <House className="h-3 w-3 shrink-0" /> Tocá la casita de arriba para volver al menú principal
            </div>
          )}

          {/* Conversación */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-3">
            {screens.map((screen, i) => (
              <ChatScreen key={i} screen={screen} isLast={i === screens.length - 1} onSelect={goTo} />
            ))}
          </div>

          {canRestartTour && (
            <button
              type="button"
              onClick={restartTour}
              className="flex items-center justify-center gap-1.5 border-t border-border bg-card px-3 py-2.5 text-xs font-medium text-primary transition hover:bg-primary/5"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Volver a ver el tutorial guiado
            </button>
          )}
        </div>
      )}

      {/* Botón — sutil, chico, arrastrable */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex h-11 w-11 cursor-grab items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition hover:text-foreground active:cursor-grabbing"
        aria-label="Ayuda"
        title="Ayuda (podés arrastrarme)"
      >
        {isOpen ? <X className="h-[18px] w-[18px]" /> : <HelpCircle className="h-[18px] w-[18px]" />}
      </button>
    </div>
  )
}

// ── Una "pantalla" del chat = una burbuja del bot con botones ──────────────
function ChatScreen({
  screen,
  isLast,
  onSelect,
}: {
  screen: Screen
  isLast: boolean
  onSelect: (s: Screen) => void
}) {
  if (screen.type === 'root') {
    return (
      <Bubble>
        <p className="mb-2 text-sm text-card-foreground">¿Sobre qué tenés dudas?</p>
        <ButtonList>
          {HELP_CATEGORIES.map((c) => (
            <OptionButton key={c.slug} disabled={!isLast} onClick={() => onSelect({ type: 'category', slug: c.slug })}>
              {c.title}
            </OptionButton>
          ))}
        </ButtonList>
      </Bubble>
    )
  }

  if (screen.type === 'category') {
    const category = HELP_CATEGORIES.find((c) => c.slug === screen.slug)
    if (!category) return null
    return (
      <Bubble>
        <p className="mb-2 text-sm text-card-foreground">{category.description}</p>
        <ButtonList>
          {category.articles.map((a) => (
            <OptionButton
              key={a.slug}
              disabled={!isLast}
              onClick={() => onSelect({ type: 'article', categorySlug: category.slug, articleSlug: a.slug })}
            >
              {a.title}
            </OptionButton>
          ))}
        </ButtonList>
      </Bubble>
    )
  }

  // screen.type === 'article'
  const category = HELP_CATEGORIES.find((c) => c.slug === screen.categorySlug)
  const article = category?.articles.find((a) => a.slug === screen.articleSlug)
  if (!category || !article) return null
  return (
    <Bubble>
      <p className="mb-1.5 text-sm font-semibold text-card-foreground">{article.title}</p>
      <div className="space-y-2">
        {article.body.map((p, i) => (
          <p key={i} className="text-xs leading-relaxed text-muted-foreground">{p}</p>
        ))}
      </div>
      <ButtonList className="mt-3">
        <OptionButton disabled={!isLast} onClick={() => onSelect({ type: 'category', slug: category.slug })}>
          <ArrowLeft className="h-3 w-3 shrink-0" /> Otras dudas de {category.title.toLowerCase()}
        </OptionButton>
      </ButtonList>
    </Bubble>
  )
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2.5 shadow-sm">
      {children}
    </div>
  )
}

function ButtonList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-1.5 ${className}`}>{children}</div>
}

function OptionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary transition hover:bg-primary/10 disabled:cursor-default disabled:opacity-40"
    >
      {children}
    </button>
  )
}
