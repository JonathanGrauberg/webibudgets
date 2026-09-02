'use client'
// components/landing/landing-sections.tsx

import {
  ArrowRight, Check, Crown, FileText, Download,
  Users, Package, Palette, Share2, HelpCircle,
  ChevronDown, LayoutGrid, UserCheck,
  Layers, User, CheckCircle, Clock, LogOut, UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react' // 👈 nuevo
import { useSearchParams } from 'next/navigation' // 👈 nuevo — para leer el código de revendedor de la URL
import { faqs } from './landing-data' // 👈 ya no usamos "plans"

import { ProductosBanner } from '../productos-banner'
import Image from "next/image"
import { useState, useEffect } from 'react'
import { PresenceMap } from "@/components/PresenceMap"
import { LandingCalculatorBento } from './calculator-showcase'
import { LandingFreeItemBento } from './LandingFreeItemBento'
import { LandingProfitSplitBento } from './LandingProfitSplitBento'
import { LandingWorkflowBento } from './LandingWorkflowBento'
import { FeaturesGrid } from './FeaturesGrid'
import { LandingLiveTasksBento } from './LandingLiveTasksBento'
import { MicrosoftStoreBadge } from '@/components/microsoft-store-badge' // 👈 nuevo

const fonts = [
  'font-sans', 
  'font-serif', 
  'font-mono', 
  'font-black tracking-tighter'
]

const colors = [
  'text-amber-500',
  'text-blue-500',
  'text-emerald-500',
  'text-rose-500',
  'text-violet-500',
  'text-orange-500'
]

interface LandingSectionsProps {
  openFaqIndex: number | null
  setOpenFaqIndex: (index: number | null) => void
  dashboardHref: string
  dashboardLabel: string
}

function DashboardMock() {
  return (
    <div className="relative flex justify-center overflow-visible">
      <Image
        src="/images/webibudgets-dashboard.png"
        alt="Dashboard WebiBudgets"
        width={1400}
        height={900}
        priority
        className="object-contain scale-[1.35] origin-center drop-shadow-[0_40px_80px_rgba(0,0,0,0.25)]"
      />
    </div>
  )
}

function BrandingMock() {
  return (
    <div className="relative flex justify-center overflow-visible">
      <Image
        src="/images/webibudgets-branding.png"
        alt="Branding WebiBudgets"
        width={1400}
        height={900}
        priority
        className="object-contain scale-[1.45] origin-center translate-y-[5%] drop-shadow-[0_40px_80px_rgba(0,0,0,0.25)]"
      />
    </div>
  )
}

function DynamicText({ text, delay = 2000 }: { text: string; delay?: number }) {
  const [fontIndex, setFontIndex] = useState(0)
  const [colorIndex, setColorIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFontIndex((prev) => (prev + 1) % fonts.length)
      setColorIndex((prev) => (prev + 1) % colors.length)
    }, delay)

    return () => clearInterval(interval)
  }, [delay])

  return (
    <span className={`transition-all duration-500 ease-in-out ${fonts[fontIndex]} ${colors[colorIndex]}`}>
      {text}
    </span>
  )
}

export function LandingSections({
  openFaqIndex,
  setOpenFaqIndex,
}: LandingSectionsProps) { 
  const [isAnnual, setIsAnnual] = useState(false)
  const { data: session } = useSession() // 👈 nuevo
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('code') // 👈 nuevo — el link que comparte un revendedor viene con ?code=ALGO

  // 👇 nuevo — si ya hay sesión, "Quiero PRO" va directo al checkout automático;
  // si no hay sesión, va a /register con la intención de PRO marcada en la URL.
  // En los dos casos, si vino un código de revendedor en la URL, lo arrastramos.
  const codeQuery = referralCode ? `&code=${encodeURIComponent(referralCode)}` : ''
  const proHref = session
    ? `/dashboard?subscription=start&interval=${isAnnual ? 'annual' : 'monthly'}${codeQuery}`
    : `/register?plan=pro&interval=${isAnnual ? 'annual' : 'monthly'}${codeQuery}`

  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ── HERO ── */}
      <section id="hero" className="relative px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-background p-8 shadow-sm lg:grid-cols-2 lg:p-14">
          <div className="pointer-events-none absolute -right-32 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-neutral-950 lg:block" />

          <div className="relative z-10">
            <h1 className="text-[clamp(3rem,10vw,6rem)] font-bold leading-[0.85] tracking-[-1px] sm:tracking-[-3px] lg:tracking-[-6px] text-foreground">              
              <span className='text-primary'>.budgets</span>
            </h1> 
            <p className="mt-4 text-lg text-muted-foreground">
              Sistema de gestión para tu negocio
            </p>
            <Link
              href="/register?plan=free"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
            >
              Empezar gratis
              <ArrowRight size={18} />
            </Link>
            <div className='mt-3 pl-3'>
            <MicrosoftStoreBadge size="small" />
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS BANNER ── */}
      <ProductosBanner />

      {/* ── BRANDING SECTION ── */}
      <section id="branding" className="relative px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-background p-8 shadow-sm lg:grid-cols-2 lg:p-14">
          <div className="pointer-events-none absolute -right-32 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-neutral-950 lg:block" />

          <div className="relative z-10">
            <h1 className="text-[clamp(3rem,10vw,6rem)] font-bold leading-[0.85] tracking-[-1px] sm:tracking-[-3px] lg:tracking-[-6px] text-foreground">
              <DynamicText text="tu marca" delay={1800} />
              <br />
              <DynamicText text="tu identidad" delay={1000} />
            </h1> 
            <p className="mt-4 text-lg text-muted-foreground">
              Mantené la identidad de tu empresa con opciones de personalización y branding.
            </p>
          </div>

          <div className="relative z-10 hidden lg:block">
            <BrandingMock />
          </div>
        </div>
      </section>

      {/* ── MICROSOFT STORE ── */}
      <section id="microsoft-store" className="px-4 py-20 sm:px-6 lg:px-8 mt-[-60]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-background p-8 shadow-sm lg:grid-cols-2 lg:p-14">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#fcc107]">También disponible</p>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Instalalo como app de Windows
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Si trabajás desde la computadora del local o la oficina, .budgets también está en la tienda oficial de Microsoft — instalación en un clic, sin pasar por el navegador.
            </p>
            <div className="mt-8">
              <MicrosoftStoreBadge size="large" />
            </div>
          </div>

          <div className="relative">
            <Image
              src="/images/microsoft-store-screenshot.png"
              alt="Vista previa de .budgets en Microsoft Store"
              width={700}
              height={500}
              className="rounded-2xl border border-border shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ── PROFIT SPLIT BENTO ── */}
      <section id="demo-profit">
        <LandingProfitSplitBento />
      </section>

      {/* ── CALCULATOR SHOWCASE ── */}
      <section id="demo-calculator">
        <LandingCalculatorBento />
      </section>

      {/* ── TEMPLATES BENTO ── */}
      <section id="demo-workflow">
        <LandingWorkflowBento />
      </section>

      {/* ── FREE ITEM BENTO ── */}
      <section id="demo-freeitem">
        <LandingFreeItemBento /> 
      </section>

      {/* ── LIVE TASKS BENTO ── */}
      <section id="demo-tasks">
        <LandingLiveTasksBento />
      </section>

      {/* ── PRESENCE MAP ── */}
      <PresenceMap />

      {/* ── FEATURES GRID ── */}
      <FeaturesGrid />

      {/* PRICING */}
<section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-6xl">
    <div className="mb-10 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#fcc107]">Planes</p>
      <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Empezá gratis. Subí a PRO cuando lo necesites.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
        Free ya te alcanza para gestionar tu negocio de punta a punta. PRO te suma las herramientas que te ahorran horas cada semana.
      </p>
    </div>

    {/* Toggle Mensual/Anual */}
<div className="mb-8 flex items-center justify-center gap-3">
  <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
    Mensual
  </span>
  <button
    type="button"
    onClick={() => setIsAnnual((v) => !v)}
    className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors ${
      isAnnual ? 'bg-[#fcc107]' : 'bg-slate-300'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
        isAnnual ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
  <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
    Anual
  </span>
  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
    Ahorrás 10%
  </span>
</div>

    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      {/* FREE — sin cambios respecto a lo que ya teníamos */}
      <div className="relative rounded-3xl border border-border bg-card p-8 text-card-foreground">
        <h3 className="text-xl font-bold">Free</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo lo que necesitás para arrancar a gestionar tu negocio, sin límites de tiempo.
        </p>

        <div className="mb-8 mt-6">
          <span className="text-5xl font-bold">$0</span>
          <span className="ml-2 text-sm text-muted-foreground">para siempre</span>
        </div>

        <Link
          href="/register?plan=free"
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Empezar gratis
          <ArrowRight size={16} />
        </Link>

        <div className="space-y-3 border-t border-border pt-6">
          {[
            'Presupuestos ilimitados',
            'Gestión de clientes y productos',
            'Tablero Kanban de tareas',
            'Vendedores, instaladores y equipo base',
            'Recibos, remitos y PDF con tu marca',
            'Rendiciones: métricas y detalle del período',
          ].map((f, j) => (
            <div key={j} className="flex items-start gap-3">
              <Check size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PRO — con precio dinámico según el toggle */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 p-8 text-neutral-50 shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#fcc107]/10 blur-2xl" />

        <div className="relative flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fcc107] px-3 py-1 text-xs font-bold text-neutral-950">
            <Crown size={13} /> PRO
          </span>
        </div>

        <h3 className="relative mt-3 text-xl font-bold">Ser PRO te ahorra horas.</h3>
        <p className="relative mt-1 text-sm text-neutral-400">
          Automatizá lo que hoy hacés a mano: cálculos, reparto de ganancias y documentos de obra.
        </p>

        {/* Precio dinámico */}
        <div className="relative mb-2 mt-6">
          <span className="text-5xl font-bold">
            ${isAnnual ? '36.000' : '40.000'}
          </span>
          <span className="ml-2 text-sm text-neutral-400">/ mes</span>
        </div>
        {isAnnual && (
          <p className="relative mb-6 text-xs text-neutral-400">
            Facturado anual: <span className="font-semibold text-neutral-200">$432.000/año</span> — ahorrás 10% vs. mensual
          </p>
        )}
        {!isAnnual && <div className="relative mb-6" />}

        {/* 👇 antes: <a href={whatsappUrl}> — ahora respeta si hay sesión o no */}
        <Link
          href={proHref}
          className="relative mb-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#fcc107] py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
        >
          Quiero PRO
          <ArrowRight size={16} />
        </Link>

        <div className="relative grid gap-3 border-t border-neutral-800 pt-6 sm:grid-cols-2">
          {[
            'Calculadora automática por m² / m³',
            'Órdenes de trabajo con QR en vivo',
            'Actualización masiva de precios',
            'Variantes de producto (talles, colores)',
            'Reeditar presupuestos ya emitidos',
            'Reparto de ganancias entre socios',
            'Dashboard con Business Intelligence',
            'Exportación de reportes',
            'Historial detallado de distribución',
            'PDFs 100% con tu marca, sin la nuestra',
          ].map((f, j) => (
            <div key={j} className="flex items-start gap-2.5">
              <Check size={16} className="mt-0.5 shrink-0 text-[#fcc107]" />
              <span className="text-sm text-neutral-300">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 👇 antes: <a href={whatsappUrl}>Escribinos por WhatsApp</a> — ya no tiene sentido para quien está logueado, así que solo se muestra a visitantes anónimos */}
    {!session && (
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Ya usás .budgets y querés pasarte a PRO?{' '}
        <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-2">
          Iniciá sesión para activarlo
        </Link>
      </p>
    )}
  </div>
</section>


      {/* ── MICROSOFT STORE ── */}
      <section id="microsoft-store" className="px-4 py-20 sm:px-6 lg:px-8 mt-[-60]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-background p-8 shadow-sm lg:grid-cols-2 lg:p-14">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#fcc107]">También disponible</p>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Instalalo como app de Windows
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Si trabajás desde la computadora del local o la oficina, .budgets también está en la tienda oficial de Microsoft — instalación en un clic, sin pasar por el navegador.
            </p>
            <div className="mt-8">
              <MicrosoftStoreBadge size="large" />
            </div>
          </div>

          <div className="relative">
            <Image
              src="/images/microsoft-store-screenshot.png"
              alt="Vista previa de .budgets en Microsoft Store"
              width={700}
              height={500}
              className="rounded-2xl border border-border shadow-lg"
            />
          </div>
        </div>
      </section>


      {/* ── FAQ ── */}
      <section id="faq" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ¿No encontrás lo que buscás? Contactá a nuestro equipo de soporte.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={
                  openFaqIndex === i
                    ? 'overflow-hidden rounded-2xl border border-foreground/30 bg-card'
                    : 'overflow-hidden rounded-2xl border border-border bg-card'
                }
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-secondary"
                >
                  <h3 className="pr-4 text-sm font-semibold text-foreground">{faq.question}</h3>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-muted-foreground transition-transform"
                    style={{ transform: openFaqIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {openFaqIndex === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-neutral-950 px-8 py-20 text-center text-neutral-50 lg:px-14">
          <h2 className="text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Transformá tu empresa hoy mismo.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-neutral-400">
            Sumate a .budgets y experimentá la diferencia de una gestión profesional, eficiente y personalizada. Ahorrá tiempo, impresioná a tus clientes y hacé crecer tu negocio con la herramienta que se adapta a vos.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register?plan=free"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-50 px-7 py-4 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
            >
              Empezar gratis
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-700 px-7 py-4 text-sm font-semibold text-neutral-50 transition hover:bg-neutral-900"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="footer" className="border-t border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                  Webi
                </span>
                <span className="font-bold text-foreground">Webi Studio</span>
              </div>
              <p className="text-sm text-muted-foreground">Sistemas de gestión para tu negocio.</p>
            </div>
            {[
              { title: 'Producto', links: [['Funciones', '#features'], ['Precios', '#pricing'], ['Manual de uso', '/manual']] },
              { title: 'Empresa', links: [['Blog', '#'], ['Nosotros', '#'], ['Contacto', '#'], ['Revendedores', '/manual#revendedores'], ['Trabajá con nosotros', '/manual#revendedores']] },
              { title: 'Legal', links: [['Privacidad', '/privacidad'], ['Términos', '/terminos']] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-muted-foreground transition hover:text-foreground">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <p className="text-xs text-muted-foreground">© 2026 Webi Studio. Todos los derechos reservados.</p>
            <p className="text-xs text-muted-foreground">Hecho con precisión por Webi Studio</p>
          </div>
        </div>
      </footer>
    </main>
  )
}