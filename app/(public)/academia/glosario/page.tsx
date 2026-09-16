// app/(public)/academia/glosario/page.tsx
//
// "Glosario PyME" — un solo instructivo público (sin login) con jerga de
// negocios/tecnología explicada en criollo, pensado para SEO (cada término
// tiene su propio ancla, ej. /academia/glosario#roi) y para compartir un
// solo link. Vive dentro de /academia (el hub), separado de las Guías para
// no mezclar el tono rápido/casual de acá con el tono más largo de esas.
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Facebook, MessageCircle, GraduationCap, ArrowLeft } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GLOSARIO_CATEGORIAS } from '@/lib/glosario-data'

export const metadata: Metadata = {
  title: 'Glosario PyME — Qué significa ROI, SaaS, KPI y más | .budgets',
  description:
    'Glosario PyME: qué es ROI, KPI, SaaS, CAC, margen bruto y más de 40 términos de negocios y tecnología, explicados en criollo con ejemplos reales — para dueños de PyME y emprendedores.',
}

const WHATSAPP_NUMBER = '5493436959359'
const WHATSAPP_MESSAGE = 'Hola! Vi el Glosario PyME de .budgets, ¿me contás más del sistema?'
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

export default async function GlosarioPage() {
  const session = await getServerSession(authOptions).catch(() => null)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav mínimo — mismo patrón que /manual y /revendedores */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-4xl font-black tracking-tighter text-primary leading-none">
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

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/academia" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Academia
        </Link>

        {/* Hero */}
        <div className="mt-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Glosario PyME</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que te preguntan y no entendés, explicado sin vueltas
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            ROI, SaaS, KPI, margen neto, CAC... palabras que hoy se usan todo el tiempo en cualquier negocio,
            aunque nadie te las haya explicado nunca. Acá están, en criollo y con un ejemplo real cada una.
          </p>
        </div>

        {/* Índice — links de ancla a cada categoría */}
        <nav className="mt-10 flex flex-wrap justify-center gap-2 rounded-2xl border border-border bg-card p-4">
          {GLOSARIO_CATEGORIAS.map((cat) => (
            <a
              key={cat.slug}
              href={`#${cat.slug}`}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {cat.titulo}
            </a>
          ))}
        </nav>

        {/* Categorías y términos */}
        <div className="mt-12 space-y-14">
          {GLOSARIO_CATEGORIAS.map((cat) => (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-20">
              <h2 className="text-xl font-bold tracking-tight">{cat.titulo}</h2>

              {cat.disclaimer && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>*</strong> Basado en información vigente sobre normativa argentina — estas reglas
                  cambian seguido, así que confirmá siempre en el sitio oficial de ARCA antes de tomar una decisión.
                </p>
              )}

              <div className="mt-5 space-y-6">
                {cat.terminos.map((t) => (
                  <div key={t.slug} id={t.slug} className="scroll-mt-20 border-b border-border pb-6 last:border-0 last:pb-0">
                    <h3 className="text-base font-bold">
                      {t.termino}
                      {t.sigla && <span className="ml-2 text-sm font-normal text-muted-foreground">({t.sigla})</span>}
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground/90">{t.definicion}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/70">Ejemplo: </span>
                      {t.ejemplo}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA final */}
        <div className="mt-16 rounded-[2.5rem] bg-neutral-950 p-10 text-center text-white sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">¿Y si tu gestión también fuera más simple?</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-400">
            .budgets es el sistema para armar presupuestos, controlar cobros y ordenar tu equipo — sin necesitar
            un ERP ni saber de tecnología.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
            >
              Probar .budgets
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-neutral-500"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar por WhatsApp
            </a>
          </div>
        </div>

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
