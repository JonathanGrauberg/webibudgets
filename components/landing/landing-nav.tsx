'use client'
// components/landing/landing-nav.tsx

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Calculator, PieChart, Layers, Gift, Sparkles } from 'lucide-react'
import { navLinks } from './landing-data'

const DEMO_ITEMS = [
  {
    title: 'Calculadora interactiva',
    desc: 'Simulá presupuestos por m², m³ o fórmulas',
    href: '#demo-calculator',
    icon: Calculator,
  },
  {
    title: 'Reparto de Ganancias',
    desc: 'Calculá el split de socios y costos en vivo',
    href: '#demo-profit',
    icon: PieChart,
  },
  {
    title: 'Flujo de trabajo',
    desc: 'De cotización a Remito y Recibo en 1 clic',
    href: '#demo-workflow',
    icon: Layers,
  },
  {
    title: 'Cortesías y descuentos',
    desc: 'Configurá items bonificados automáticamente',
    href: '#demo-freeitem',
    icon: Gift,
  },
  {
    title: 'Tareas en vivo',
    desc: 'Organizá tus tareas en un tablero Kanban interactivo',
    href: '#demo-tasks',
    icon: Sparkles,
  }

]

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const { data: session } = useSession()

  const dashboardHref = session
    ? session.user?.role === 'owner'
      ? '/admin'
      : '/dashboard'
    : '/auth/login'

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border bg-background/80 px-4 py-2.5 backdrop-blur-md sm:px-6">
        {/* Logo */}
        <Link href="#hero" className="flex items-center gap-2.5">
          <span className="leading-tight">
            <span className="block text-xl font-bold tracking-tight text-primary">
              .budgets
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => {
                setActiveIndex(i)
                setDropdownOpen(false)
              }}
              className="relative rounded-full px-4 py-1.5 text-sm font-medium"
            >
              {i === activeIndex && (
                <motion.div
                  layoutId="landing-nav-pill"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 25,
                  }}
                  className="absolute inset-0 rounded-full border border-border bg-white shadow-sm"
                />
              )}

              <span
                className={`relative z-10 ${
                  i === activeIndex
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </span>
            </Link>
          ))}

          {/* MENÚ DESPLEGABLE: DEMOS EN VIVO */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Testeá en vivo</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 top-full mt-2 w-80 -translate-x-1/2 rounded-3xl border border-border bg-background p-2 shadow-2xl backdrop-blur-xl"
                >
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Herramientas interactivas
                  </div>
                  <div className="space-y-1">
                    {DEMO_ITEMS.map((item) => {
                      const Icon = item.icon
                      return (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={() => {
                            setDropdownOpen(false)
                            setActiveIndex(null)
                          }}
                          className="flex items-start gap-3 rounded-2xl p-2.5 transition hover:bg-secondary"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Link
            href={dashboardHref}
            className="hidden rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 sm:inline-flex"
          >
            {session ? 'Ir al Panel' : 'Iniciar sesión'}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
            aria-label="Abrir menú"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-border bg-background p-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => {
                  setActiveIndex(i)
                  setOpen(false)
                }}
                className={
                  i === activeIndex
                    ? 'rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm'
                    : 'rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground'
                }
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 border-t border-border pt-2">
              <div className="px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Demos en vivo
              </div>
              {DEMO_ITEMS.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
                >
                  <item.icon className="h-4 w-4 text-amber-500" />
                  <span>{item.title}</span>
                </a>
              ))}
            </div>

            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-center text-sm font-semibold text-background"
            >
              {session ? 'Ir al Panel' : 'Iniciar sesión'}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}