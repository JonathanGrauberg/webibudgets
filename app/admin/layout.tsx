'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react' // 👈 Importamos el método nativo de NextAuth

const navLinks = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/tenants', label: 'Tenants' },
  { href: '/admin/create-tenant', label: 'Nuevo tenant' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-black overflow-hidden">
      
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#f8f8f6]/90 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="mx-auto flex items-center justify-between gap-4 max-w-7xl">

          {/* Brand */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-primary tracking-tighter">.budgets</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Admin
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3.5 py-1.5 font-medium transition ${
                  pathname === href
                    ? 'bg-black text-white'
                    : 'text-zinc-500 hover:bg-zinc-200 hover:text-black'
                }`}
              >
                {label}
              </Link>
            ))}
            <span className="mx-2 h-4 w-px bg-zinc-300" />
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Ver como cliente →
            </Link>

            {/* 🚪 Botón Cerrar Sesión para Desktop */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="ml-1 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Cerrar sesión
            </button>
          </nav>

          {/* Mobile: client link + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-100"
            >
              Cliente →
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white transition hover:bg-zinc-100"
              aria-label="Menú"
            >
              {menuOpen ? (
                // X
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ) : (
                // Hamburger
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden mt-2 border-t border-zinc-200 pt-3 pb-1 space-y-1.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  pathname === href
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
                }`}
              >
                {label}
                {pathname === href && (
                  <span className="text-xs opacity-60">←</span>
                )}
              </Link>
            ))}
            
            <div className="h-px bg-zinc-200 my-1" />

            {/* 🚪 Botón Cerrar Sesión para Mobile */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center justify-between rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <span>Cerrar sesión</span>
              <span className="text-xs opacity-60">🚪</span>
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}