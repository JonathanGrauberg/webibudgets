import React from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4 max-w-7xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Webi Studio Admin</p>
            <h1 className="mt-2 text-2xl font-bold">Administrador SaaS</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/admin" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Inicio
            </Link>
            <Link href="/admin/tenants" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Tenants
            </Link>
            <Link href="/admin/create-tenant" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Nuevo tenant
            </Link>
            <Link href="/dashboard" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Cliente
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
