// app/(public)/manual/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
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

        <Link
          href={session ? '/dashboard' : '/auth/login'}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          {session ? 'Volver al sistema' : 'Iniciar sesión'}
        </Link>
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
      </div>
    </div>
  )
}
