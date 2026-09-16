// app/(public)/campus/guias/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Facebook, ArrowLeft, ArrowRight, Library } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GUIAS } from '@/lib/guias-data'
import { BlobBackground } from '@/components/campus/blob-background'

export const metadata: Metadata = {
  title: 'Guías para dueños de PyME | Campus .budgets',
  description:
    'Guías prácticas en capítulos sobre estrategia B2B, ventas y crecimiento para dueños de PyME y emprendedores — contenido gratis de .budgets.',
}

export default async function GuiasIndexPage() {
  const session = await getServerSession(authOptions).catch(() => null)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
          .budgets
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <a href="https://www.instagram.com/budgets.app/" target="_blank" rel="noopener noreferrer" aria-label="Instagram de .budgets" className="text-muted-foreground transition hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.facebook.com/budgetsporwebistudio" target="_blank" rel="noopener noreferrer" aria-label="Facebook de .budgets" className="text-muted-foreground transition hover:text-foreground">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
          <Link href={session ? '/dashboard' : '/auth/login'} className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">
            {session ? 'Volver al sistema' : 'Iniciar sesión'}
          </Link>
        </div>
      </header>

      <div className="relative overflow-hidden">
        <BlobBackground variant="compact" />
        <div className="relative mx-auto max-w-3xl px-6 pb-4 pt-10">
          <Link href="/campus" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Campus
          </Link>

          <div className="mt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Library className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Guías</p>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Para cuando querés profundizar en algo puntual
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Contenido en capítulos, sin exámenes ni obligación — leé el que te sirva, cuando te sirva.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-14">
        <div className="mt-4 space-y-5">
          {GUIAS.map((guia) => (
            <Link
              key={guia.slug}
              href={`/campus/guias/${guia.slug}`}
              className="group block rounded-[2rem] border border-border bg-card p-8 transition hover:border-primary/40 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {guia.capitulos.length} capítulos
              </p>
              <h2 className="mt-1 text-xl font-bold">{guia.titulo}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{guia.descripcionCorta}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Empezar <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <span>Seguinos:</span>
          <a href="https://www.instagram.com/budgets.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition hover:text-foreground">
            <Instagram className="h-4 w-4" /> Instagram
          </a>
          <a href="https://www.facebook.com/budgetsporwebistudio" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition hover:text-foreground">
            <Facebook className="h-4 w-4" /> Facebook
          </a>
        </div>
      </div>
    </div>
  )
}
