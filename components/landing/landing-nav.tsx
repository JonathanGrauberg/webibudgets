'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { navLinks, dashboardHref } from './landing-data'

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border bg-background/80 px-4 py-2.5 backdrop-blur-md sm:px-6">
        {/* Logo */}
        <Link href="#hero" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
            Webi
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-foreground">Webi Studio</span>
            <span className="block text-[11px] text-muted-foreground">Sistema de Gestión</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setActiveIndex(i)}
              className={
                i === activeIndex
                  ? 'rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-foreground'
                  : 'rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Sign in */}
        <div className="flex items-center gap-2">
          <Link
            href={dashboardHref}
            className="hidden rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 sm:inline-flex"
          >
            Sign in
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
                    ? 'rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-foreground'
                    : 'rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground'
                }
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-center text-sm font-semibold text-background"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
