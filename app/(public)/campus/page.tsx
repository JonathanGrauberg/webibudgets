// app/(public)/campus/page.tsx
//
// Hub de Campus — enlaza al Glosario (rápido, casual) y a las Guías
// (más largas, tono más serio). Separados a propósito para no mezclar tonos.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Facebook, GraduationCap, BookOpen, Library, ArrowRight } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BlobBackground } from '@/components/campus/blob-background'

export const metadata: Metadata = {
  title: 'Campus | .budgets',
  description:
    'Campus .budgets: el Glosario PyME (jerga de negocios y tecnología explicada en criollo) y Guías prácticas de venta, liderazgo y estrategia para dueños de PyME.',
}

export default async function CampusHubPage() {
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
        <BlobBackground />
        <div className="relative mx-auto max-w-4xl px-6 pb-4 pt-16 sm:pt-20">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Campus</p>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Para entender el negocio, no solo para usar el sistema
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Contenido gratis para dueños de PyME y emprendedores — de la jerga del día a día a cómo encarar
              decisiones más grandes de venta y equipo.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-14">
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Link
            href="/campus/glosario"
            className="group rounded-[2rem] border border-border bg-card p-8 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Glosario PyME</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ROI, SaaS, KPI, margen neto... más de 40 términos que se usan todo el tiempo, explicados sin
              vueltas y con un ejemplo real cada uno. Para consultar rápido.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Ver el glosario <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/campus/guias"
            className="group rounded-[2rem] border border-border bg-card p-8 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Guías</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Contenido más largo, en capítulos, sobre venta, estrategia y liderazgo de equipo — para cuando
              tenés unos minutos y querés profundizar en algo puntual.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Ver las guías <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
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
