'use client'

import {
  ArrowRight, Check, FileText, Download,
  Users, Package, Palette, Share2,
  Star, ChevronDown, LayoutGrid, UserCheck,
  Layers, User, CheckCircle, Clock, LogOut,
} from 'lucide-react'
import Link from 'next/link'
import {
  brandStats, brandSwatches, features,
  faqs, plans, testimonials,
  sidebarItems, dashboardStats,
} from './landing-data'

const featureIcons = { FileText, Download, Users, Package, Palette, Share2 } as const
const sidebarIcons = { LayoutGrid, Users, Package, FileText, UserCheck, Layers, User } as const
const statIcons = { Users, Package, FileText, CheckCircle, Clock } as const

interface LandingSectionsProps {
  openFaqIndex: number | null
  setOpenFaqIndex: (index: number | null) => void
  dashboardHref: string
  dashboardLabel: string
}

/* ── Mock dashboard recreated in CSS (replaceable with PNG) ── */
function DashboardMock() {
  return (
    <div className="pointer-events-none relative select-none">
      {/* Sidebar */}
      <div className="absolute left-0 top-6 z-20 w-64 rotate-[-4deg] rounded-3xl bg-neutral-900 p-4 text-neutral-100 shadow-2xl">
        <div className="mb-4 flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold">
            Webi
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-bold">Webi Studio</span>
            <span className="block text-[10px] text-neutral-400">Sistema de Gestión</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {sidebarItems.map((item) => {
            const Icon = sidebarIcons[item.icon as keyof typeof sidebarIcons]
            return (
              <div
                key={item.label}
                className={
                  item.active
                    ? 'flex items-center gap-2.5 rounded-xl bg-neutral-700/70 px-3 py-2 text-xs font-medium'
                    : 'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-neutral-400'
                }
              >
                <Icon size={15} />
                {item.label}
              </div>
            )
          })}
          <p className="mt-3 px-3 text-[10px] uppercase tracking-widest text-neutral-600">Configuración</p>
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-neutral-400">
            <LayoutGrid size={15} />
            Configuración
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-neutral-700/50 px-3 py-2.5 text-xs">
          <LogOut size={14} />
          Cerrar sesión
        </div>
        <p className="mt-3 text-center text-[10px] text-neutral-600">v1.0.0 · Creado por Webi</p>
      </div>

      {/* Dashboard cards on black circle */}
      <div className="relative ml-32 flex h-[460px] w-full items-center justify-center overflow-hidden rounded-3xl bg-neutral-950">
        <div className="absolute inset-0 flex items-start justify-center pt-8">
          <div className="w-[88%] space-y-3 pl-12">
            {/* Header card */}
            <div className="w-3/4 rounded-2xl bg-white p-4 shadow-lg">
              <p className="text-sm font-bold text-neutral-900">Dashboard</p>
              <p className="text-[11px] text-neutral-500">Sistema de gestión Webi Studio</p>
            </div>

            {/* Stat cards */}
            <div className="flex gap-2.5 overflow-hidden">
              {dashboardStats.map((stat) => {
                const Icon = statIcons[stat.icon as keyof typeof statIcons]
                return (
                  <div key={stat.label} className="flex min-w-[92px] flex-col rounded-2xl bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">{stat.label}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100">
                        <Icon size={12} className="text-neutral-700" />
                      </span>
                    </div>
                    <span className="text-xl font-bold text-neutral-900">{stat.value}</span>
                    <span className="text-[9px] text-neutral-400">{stat.sub}</span>
                  </div>
                )
              })}
            </div>

            {/* Recent budgets */}
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-neutral-900">Presupuestos Recientes</p>
                <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-[9px] text-neutral-500">Ver todos</span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5">
                <div>
                  <p className="text-[11px] font-semibold text-neutral-800">Neostone</p>
                  <p className="text-[9px] text-neutral-400">1 item(s) · 09 de jun de 2026</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700">Pendiente</span>
                  <span className="text-xs font-bold text-neutral-900">$180.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingSections({
  openFaqIndex,
  setOpenFaqIndex,
  dashboardHref,
  dashboardLabel,
}: LandingSectionsProps) {
  return (
    <main className="overflow-x-hidden bg-background text-foreground">

      {/* ── HERO ── */}
      <section id="hero" className="relative px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-border bg-background p-8 shadow-sm lg:grid-cols-2 lg:p-14">
          {/* Black shape on the right */}
          <div className="pointer-events-none absolute -right-32 top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-neutral-950 lg:block" />

          {/* Left copy */}
          <div className="relative z-10">
            <h1 className="text-6xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              Webi
              <br />
              Studio
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Sistema de gestión para tu negocio
            </p>
            <Link
              href={dashboardHref}
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98]"
            >
              {dashboardLabel === 'Dashboard' ? 'Ver Dashboard' : 'Ver Dashboard'}
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Right mock */}
          <div className="relative z-10 hidden lg:block">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS banner ── */}
      <section id="productos" className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 overflow-hidden rounded-[2.5rem] bg-neutral-950 px-8 py-14 text-neutral-50 sm:flex-row sm:items-end sm:justify-between lg:px-14 lg:py-20">
          <div>
            <p className="text-sm text-neutral-400">Sistema de gestión</p>
            <h2 className="mt-3 text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl">Productos</h2>
          </div>
          <Link
            href={dashboardHref}
            className="inline-flex w-fit items-center gap-3 rounded-full bg-neutral-50 px-7 py-4 text-sm font-semibold text-neutral-950 transition hover:opacity-90 active:scale-[0.98]"
          >
            Explorar
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Todo lo que necesitás
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
              Funciones diseñadas para negocios modernos que quieren control y flexibilidad.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = featureIcons[feature.icon as keyof typeof featureIcons]
              return (
                <div
                  key={i}
                  className="group rounded-3xl border border-border bg-card p-7 transition hover:shadow-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background transition group-hover:scale-105">
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-card-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Precios simples y transparentes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
              Elegí el plan ideal para tu negocio. Todos incluyen 14 días de prueba gratis.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={
                  plan.featured
                    ? 'relative rounded-3xl bg-neutral-950 p-8 text-neutral-50 shadow-xl md:scale-105'
                    : 'relative rounded-3xl border border-border bg-card p-8 text-card-foreground'
                }
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-50 px-4 py-1 text-xs font-bold text-neutral-950">
                    Más popular
                  </div>
                )}

                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className={plan.featured ? 'mt-1 text-sm text-neutral-400' : 'mt-1 text-sm text-muted-foreground'}>
                  {plan.description}
                </p>

                <div className="mb-8 mt-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className={plan.featured ? 'ml-2 text-sm text-neutral-400' : 'ml-2 text-sm text-muted-foreground'}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <Link
                  href={dashboardHref}
                  className={
                    plan.featured
                      ? 'mb-8 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-50 py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90'
                      : 'mb-8 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition hover:opacity-90'
                  }
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </Link>

                <div
                  className={
                    plan.featured
                      ? 'space-y-3 border-t border-neutral-800 pt-6'
                      : 'space-y-3 border-t border-border pt-6'
                  }
                >
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 shrink-0" />
                      <span className={plan.featured ? 'text-sm text-neutral-300' : 'text-sm text-muted-foreground'}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANDING ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Tu marca, tu identidad
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
              Personalizá cada aspecto para que coincida con tu marca. Tus presupuestos siempre van a lucir profesionales.
            </p>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Colores de marca</h3>
                <div className="flex gap-3">
                  {brandSwatches.map((color, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 cursor-pointer rounded-xl border border-border transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Subir logo</h3>
                <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center transition hover:border-foreground/40">
                  <FileText size={28} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">Arrastrá tu logo o hacé clic para explorar</p>
                  <p className="text-xs text-muted-foreground/70">PNG, SVG hasta 5MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-border bg-card p-8">
                <div className="rounded-2xl bg-secondary p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">A</div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Acme Corp</p>
                        <p className="text-xs text-muted-foreground">acme.com</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-foreground">$2.450</span>
                  </div>
                  <div className="mb-6 space-y-2.5 border-t border-border pt-5">
                    {[
                      ['Diseño web', '$1.500'],
                      ['Desarrollo (20hs @ $35/h)', '$700'],
                      ['Gestión de proyecto', '$250'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-border pt-4 font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">$2.450</span>
                  </div>
                </div>
                <Link
                  href={dashboardHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  Descargar PDF de muestra
                  <Download size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-border bg-card p-5 text-center">
                  <p className="text-3xl font-bold text-foreground">20+</p>
                  <p className="mt-1 text-xs text-muted-foreground">Estilos de fuente</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 text-center">
                  <p className="text-3xl font-bold text-foreground">12+</p>
                  <p className="mt-1 text-xs text-muted-foreground">Plantillas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
              Miles de empresas ya simplificaron su gestión con Webi Studio.
            </p>
          </div>

          <div className="mb-12 grid gap-5 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-7">
                <div className="mb-4 flex gap-1">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{t.content}</p>
                <div className="flex items-center gap-3 border-t border-border pt-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {t.image}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {brandStats.map((stat, i) => (
              <div key={i} className="rounded-3xl bg-neutral-950 p-8 text-center text-neutral-50">
                <p className="mb-2 text-4xl font-bold">{stat.value}</p>
                <p className="text-sm text-neutral-400">{stat.label}</p>
              </div>
            ))}
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
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-neutral-950 px-8 py-20 text-center text-neutral-50 lg:px-14">
          <h2 className="text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Transformá tu negocio hoy mismo.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-neutral-400">
            Sumate a miles de empresas que simplificaron su gestión y ahorran horas cada semana. Empezá tu prueba gratis de 14 días, sin tarjeta de crédito.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={dashboardHref}
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
              <p className="text-sm text-muted-foreground">Sistema de gestión para tu negocio.</p>
            </div>
            {[
              { title: 'Producto', links: [['Funciones', '#features'], ['Precios', '#pricing'], ['Productos', '#productos']] },
              { title: 'Empresa', links: [['Blog', '#'], ['Nosotros', '#'], ['Contacto', '#']] },
              { title: 'Legal', links: [['Privacidad', '#'], ['Términos', '#']] },
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
