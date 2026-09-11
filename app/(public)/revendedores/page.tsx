// app/(public)/revendedores/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Facebook, ArrowRight, MessageCircle, Users, Percent, Handshake } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Programa de Revendedores | .budgets',
  description:
    'Sumate como revendedor de .budgets: recomendá el sistema a tus contactos, dales un descuento con tu código propio, y ganá una comisión por cada cliente que sume.',
}

const WHATSAPP_NUMBER = '5493436959359'
const WHATSAPP_MESSAGE = 'Hola! Quiero sumarme como revendedor de .budgets, ¿me contás cómo funciona?'
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const AUDIENCE = [
  'Contadores y estudios contables',
  'Consultores de negocio y de gestión',
  'Diseñadores y agencias que arman marca para PyMEs',
  'Técnicos y freelancers de sistemas',
  'Cualquiera que ya hable con dueños de talleres, contratistas o negocios de servicios',
]

const STEPS = [
  {
    icon: Users,
    title: 'Te damos tu código',
    description: 'Un código de descuento propio, exclusivo para vos, que le das a cada contacto que quiera probar .budgets.',
  },
  {
    icon: Percent,
    title: 'Ellos se suman con descuento',
    description: 'Tu contacto se registra usando tu código y arranca con un beneficio en el plan PRO — vos quedás bien parado desde el primer día.',
  },
  {
    icon: Handshake,
    title: 'Vos ganás una comisión',
    description: 'Por cada cliente que sume con tu código, cobrás una comisión. Lo coordinamos a medida con cada revendedor, sin letra chica.',
  },
]

export default async function ResellersPage() {
  const session = await getServerSession(authOptions).catch(() => null)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav mínimo — mismo patrón que /manual y /pricing */}
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

      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* Hero */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Programa de Revendedores</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Ganá vendiendo <span className="text-primary">.budgets</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Si ya trabajás con dueños de PyMEs, talleres o negocios de servicios, recomendales el sistema que les ordena los presupuestos, el stock y los cobros — y ganá una comisión por cada uno que se sume.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            Quiero ser revendedor
          </a>
        </div>

        {/* Cómo funciona */}
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="rounded-[2rem] border border-border bg-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paso {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            )
          })}
        </div>

        {/* A quién le sirve */}
        <div className="mt-16 rounded-[2rem] border border-border bg-card p-8 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">¿Es para vos?</h2>
          <p className="mt-2 text-muted-foreground">
            No hace falta ser programador ni saber de sistemas — solo conocer gente que gestiona un negocio a mano.
          </p>
          <ul className="mt-6 space-y-3">
            {AUDIENCE.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA final */}
        <div className="mt-16 rounded-[2.5rem] bg-neutral-950 p-10 text-center text-white sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">¿Te copás?</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-400">
            Escribinos por WhatsApp y lo coordinamos juntos — cada revendedor arranca con una charla, no con un formulario automático.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            <MessageCircle className="h-4 w-4" />
            Hablar por WhatsApp
          </a>
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
