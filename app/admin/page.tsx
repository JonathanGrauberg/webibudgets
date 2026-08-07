import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Building2, Crown, Ticket, ArrowUpRight, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [totalTenants, totalUsers, proTenants, activeResellerCodes] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.tenant.count({ where: { plan: 'custom' } }),
    prisma.resellerCode.count({ where: { active: true } }),
  ])

  const stats = [
    { label: 'Tenants totales', value: totalTenants, icon: Building2, color: 'text-zinc-900' },
    { label: 'Usuarios totales', value: totalUsers, icon: Users, color: 'text-zinc-900' },
    { label: 'Tenants PRO', value: proTenants, icon: Crown, color: 'text-amber-600' },
    { label: 'Códigos activos', value: activeResellerCodes, icon: Ticket, color: 'text-emerald-600' },
  ]

  const sections = [
    { title: 'Tenants', description: 'Gestionar planes, trial y módulos por tenant', href: '/admin/tenants', icon: Building2 },
    { title: 'Revendedores', description: 'Códigos de descuento y comisiones a pagar', href: '/admin/resellers', icon: Ticket },
    { title: 'Nuevo tenant', description: 'Alta manual de un cliente beta', href: '/admin/create-tenant', icon: Plus },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Panel Admin</p>
            <h1 className="text-4xl font-black tracking-tighter text-zinc-950">.budgets</h1>
            <p className="mt-2 text-sm text-zinc-500">Gestioná tenants, planes y revendedores.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Ver como cliente <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`mt-3 text-4xl font-black leading-none tracking-tighter ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Secciones */}
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Secciones</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition group-hover:bg-zinc-950 group-hover:text-white">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="flex items-center gap-1.5 font-semibold text-zinc-900">
                  {s.title}
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 transition group-hover:text-zinc-500" />
                </p>
                <p className="mt-1 text-sm text-zinc-500">{s.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}