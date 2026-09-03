// app/(public)/manual/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Facebook } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HelpManual } from '@/components/help/help-manual'

export const metadata: Metadata = {
  title: 'Manual de uso | .budgets',
  description:
    'Guía completa de .budgets: presupuestos, clientes, stock, órdenes de trabajo, rendiciones, calculadora por m²/m³/horas y todo lo que hace el sistema, explicado simple.',
}

export default async function ManualPage() {
  const session = await getServerSession(authOptions).catch(() => null)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav mínimo — mismo patrón que /pricing */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-4xl font-black tracking-tighter text-primary leading-none"
        >
          .budgets
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="https://www.instagram.com/budgets.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de .budgets"
              className="text-muted-foreground transition hover:text-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/budgetsporwebistudio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de .budgets"
              className="text-muted-foreground transition hover:text-foreground"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
          <Link
            href={session ? '/dashboard' : '/auth/login'}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            {session ? 'Volver al sistema' : 'Iniciar sesión'}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ayuda</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Manual de uso</h1>
          <p className="mt-2 text-muted-foreground">
            Todo lo que hace el sistema, explicado simple. Buscá por palabra clave o navegá por sección.
          </p>
        </div>

        <HelpManual />

        <div className="mt-16 flex items-center justify-center gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <span>Seguinos:</span>
          <a
            href="https://www.instagram.com/budgets.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition hover:text-foreground"
          >
            <Instagram className="h-4 w-4" /> Instagram
          </a>
          <a
            href="https://www.facebook.com/budgetsporwebistudio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition hover:text-foreground"
          >
            <Facebook className="h-4 w-4" /> Facebook
          </a>
        </div>
      </div>
    </div>
  )
}
