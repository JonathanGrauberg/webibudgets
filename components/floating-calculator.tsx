'use client'
// components/floating-calculator.tsx
//
// Calculadora simple flotante — para cuentas rápidas mientras se carga un
// presupuesto o una cotización, sin salir de la pantalla ni abrir la
// calculadora del sistema operativo. Arrastrable (mismo mecanismo que
// components/help/floating-help-widget.tsx), activada por defecto, y
// se puede desactivar desde Configuración (ver lib/calc-widget-prefs.ts —
// preferencia personal en localStorage, no de la empresa).

import { useEffect, useRef, useState } from 'react'
import { Calculator, X, Delete } from 'lucide-react'
import { CALC_WIDGET_STORAGE_KEY, CALC_WIDGET_TOGGLE_EVENT, isCalcWidgetEnabled } from '@/lib/calc-widget-prefs'

const POSITION_KEY = 'calc-widget-position'
const HINT_DISMISSED_KEY = 'calc-widget-hint-dismissed'
const BUTTON_SIZE = 44
const DRAG_THRESHOLD = 6

type Operator = '+' | '-' | '×' | '÷'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function defaultPosition() {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  // 👇 esquina inferior IZQUIERDA por defecto — la de ayuda ya vive abajo a
  // la derecha, así no arrancan superpuestas la primera vez.
  return { x: 24, y: window.innerHeight - BUTTON_SIZE - 24 }
}

function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  // 👇 evita basura de punto flotante (0.1 + 0.2) sin perder precisión real
  const rounded = Math.round(n * 1e10) / 1e10
  return rounded.toLocaleString('es-AR', { maximumFractionDigits: 10 })
}

export function FloatingCalculator() {
  const [enabled, setEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState(defaultPosition)
  const [isOpen, setIsOpen] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [pendingOp, setPendingOp] = useState<Operator | null>(null)
  const [justEvaluated, setJustEvaluated] = useState(false)

  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; dragged: boolean } | null>(null)

  useEffect(() => {
    setMounted(true)
    setEnabled(isCalcWidgetEnabled())

    try {
      setShowHint(localStorage.getItem(HINT_DISMISSED_KEY) !== 'true')
    } catch {
      setShowHint(true)
    }

    const onToggle = () => setEnabled(isCalcWidgetEnabled())
    window.addEventListener(CALC_WIDGET_TOGGLE_EVENT, onToggle)
    window.addEventListener('storage', (e) => { if (e.key === CALC_WIDGET_STORAGE_KEY) onToggle() })

    try {
      const saved = localStorage.getItem(POSITION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setPosition({
          x: clamp(parsed.x, 0, window.innerWidth - BUTTON_SIZE),
          y: clamp(parsed.y, 0, window.innerHeight - BUTTON_SIZE),
        })
      } else {
        setPosition(defaultPosition())
      }
    } catch {
      setPosition(defaultPosition())
    }

    return () => window.removeEventListener(CALC_WIDGET_TOGGLE_EVENT, onToggle)
  }, [])

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
      dismissHint()
    }
    dragState.current = null
  }

  function dismissHint() {
    setShowHint(false)
    try { localStorage.setItem(HINT_DISMISSED_KEY, 'true') } catch {}
  }

  function reset() {
    setDisplay('0')
    setStored(null)
    setPendingOp(null)
    setJustEvaluated(false)
  }

  function inputDigit(d: string) {
    if (justEvaluated) {
      setDisplay(d)
      setJustEvaluated(false)
      return
    }
    setDisplay((prev) => (prev === '0' ? d : prev.length < 15 ? prev + d : prev))
  }

  function inputDot() {
    if (justEvaluated) {
      setDisplay('0.')
      setJustEvaluated(false)
      return
    }
    setDisplay((prev) => (prev.includes('.') ? prev : prev + '.'))
  }

  function toggleSign() {
    setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : prev === '0' ? prev : `-${prev}`))
  }

  function backspace() {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'))
  }

  function applyOperator(op: Operator) {
    const current = parseFloat(display)
    if (stored === null) {
      setStored(current)
    } else if (pendingOp && !justEvaluated) {
      setStored(compute(stored, current, pendingOp))
    }
    setPendingOp(op)
    setJustEvaluated(true) // 👈 el próximo dígito arranca un número nuevo
  }

  function compute(a: number, b: number, op: Operator): number {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b === 0 ? NaN : a / b
    }
  }

  function evaluate() {
    if (pendingOp === null || stored === null) return
    const current = parseFloat(display)
    const result = compute(stored, current, pendingOp)
    setDisplay(String(result))
    setStored(null)
    setPendingOp(null)
    setJustEvaluated(true)
  }

  function percent() {
    const current = parseFloat(display)
    setDisplay(String(current / 100))
  }

  if (!mounted || !enabled) return null

  const opensLeft = position.x > window.innerWidth / 2
  const opensUp = position.y > window.innerHeight / 2

  return (
    <div className="fixed z-50" style={{ left: position.x, top: position.y, touchAction: 'none' }}>
      {isOpen && (
        <div
          className="absolute w-[240px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          style={{
            [opensLeft ? 'right' : 'left']: 0,
            [opensUp ? 'bottom' : 'top']: BUTTON_SIZE + 10,
          }}
        >
          <div className="flex items-center justify-between border-b border-border bg-foreground px-3 py-2 text-background">
            <span className="text-xs font-semibold">Calculadora</span>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-background/70 transition hover:bg-background/10 hover:text-background" aria-label="Cerrar calculadora">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="bg-muted/30 px-3 py-3 text-right">
            {pendingOp && (
              <p className="truncate text-[11px] text-muted-foreground">
                {stored !== null ? formatResult(stored) : ''} {pendingOp}
              </p>
            )}
            <p className="truncate text-2xl font-semibold tabular-nums">{display}</p>
          </div>

          <div className="grid grid-cols-4 gap-1 p-2">
            <CalcButton onClick={reset} variant="muted">C</CalcButton>
            <CalcButton onClick={toggleSign} variant="muted">±</CalcButton>
            <CalcButton onClick={percent} variant="muted">%</CalcButton>
            <CalcButton onClick={() => applyOperator('÷')} variant="operator" active={pendingOp === '÷'}>÷</CalcButton>

            <CalcButton onClick={() => inputDigit('7')}>7</CalcButton>
            <CalcButton onClick={() => inputDigit('8')}>8</CalcButton>
            <CalcButton onClick={() => inputDigit('9')}>9</CalcButton>
            <CalcButton onClick={() => applyOperator('×')} variant="operator" active={pendingOp === '×'}>×</CalcButton>

            <CalcButton onClick={() => inputDigit('4')}>4</CalcButton>
            <CalcButton onClick={() => inputDigit('5')}>5</CalcButton>
            <CalcButton onClick={() => inputDigit('6')}>6</CalcButton>
            <CalcButton onClick={() => applyOperator('-')} variant="operator" active={pendingOp === '-'}>−</CalcButton>

            <CalcButton onClick={() => inputDigit('1')}>1</CalcButton>
            <CalcButton onClick={() => inputDigit('2')}>2</CalcButton>
            <CalcButton onClick={() => inputDigit('3')}>3</CalcButton>
            <CalcButton onClick={() => applyOperator('+')} variant="operator" active={pendingOp === '+'}>+</CalcButton>

            <CalcButton onClick={() => inputDigit('0')} className="col-span-2 justify-start pl-4">0</CalcButton>
            <CalcButton onClick={inputDot}>.</CalcButton>
            <CalcButton onClick={evaluate} variant="equals">=</CalcButton>
          </div>

          <button
            type="button"
            onClick={backspace}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs text-muted-foreground transition hover:bg-muted/50"
          >
            <Delete className="h-3.5 w-3.5" /> Borrar último
          </button>
        </div>
      )}

      {/* 👇 cartelito de primera vez — se guarda como visto apenas se cierra o se usa la calculadora */}
      {showHint && !isOpen && (
        <div
          className="absolute flex w-52 items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-card-foreground shadow-lg"
          style={{
            [opensLeft ? 'right' : 'left']: 0,
            [opensUp ? 'bottom' : 'top']: BUTTON_SIZE + 10,
          }}
        >
          <Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="flex-1">Calculadora rápida — la podés desactivar desde Configuración si no la usás.</p>
          <button type="button" onClick={dismissHint} aria-label="Cerrar aviso" className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex h-11 w-11 cursor-grab items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition hover:text-foreground active:cursor-grabbing"
        aria-label="Calculadora"
        title="Calculadora (podés arrastrarme — desactivala desde Configuración si no la usás)"
      >
        {isOpen ? <X className="h-[18px] w-[18px]" /> : <Calculator className="h-[18px] w-[18px]" />}
      </button>
    </div>
  )
}

function CalcButton({
  children,
  onClick,
  variant = 'default',
  active = false,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'muted' | 'operator' | 'equals'
  active?: boolean
  className?: string
}) {
  const base = 'flex h-9 items-center justify-center rounded-lg text-sm font-medium transition'
  const styles = {
    default: 'bg-muted/40 text-foreground hover:bg-muted',
    muted: 'bg-muted/70 text-muted-foreground hover:bg-muted',
    operator: active
      ? 'bg-primary text-primary-foreground'
      : 'bg-primary/10 text-primary hover:bg-primary/20',
    equals: 'bg-primary text-primary-foreground hover:opacity-90',
  }[variant]

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}
