import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminPage() {
  const totalTenants = await prisma.tenant.count()
  const totalUsers = await prisma.user.count()

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10 space-y-6 sm:space-y-10">

        {/* ── Hero header ── */}
        <div className="flex items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5 sm:mb-2">
              Panel Admin
            </p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-none">
              Webi<span className="text-primary">Budgets</span>
            </h1>
            <p className="mt-1.5 sm:mt-2 text-sm text-zinc-400 hidden sm:block">
              Gestioná tenants, usuarios y onboarding de clientes.
            </p>
          </div>

          {/* Mobile: icon-only pill / Desktop: full label */}
          <Link
            href="/admin/create-tenant"
            className="shrink-0 mb-0 sm:mb-1 inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 sm:px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Nuevo tenant</span>
          </Link>
        </div>

        {/* thin divider */}
        <div className="h-px bg-zinc-200" />

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Tenants
            </p>
            <p className="mt-2 sm:mt-4 text-[44px] sm:text-[56px] font-black leading-none tracking-tighter text-black">
              {totalTenants}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-zinc-400 leading-snug">
              <span className="sm:hidden">Activos en el sistema.</span>
              <span className="hidden sm:inline">Tenants activos y configurados en el sistema.</span>
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Usuarios
            </p>
            <p className="mt-2 sm:mt-4 text-[44px] sm:text-[56px] font-black leading-none tracking-tighter text-black">
              {totalUsers}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-zinc-400 leading-snug">
              <span className="sm:hidden">Cuentas en el sistema.</span>
              <span className="hidden sm:inline">Cuentas de clientes y administradores en el sistema.</span>
            </p>
          </div>
        </div>

        {/* ── Quick actions (mobile only) ── */}
        <div className="flex gap-2 sm:hidden">
          <Link
            href="/admin/tenants"
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-center text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition"
          >
            Ver tenants
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-center text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition"
          >
            Ver como cliente
          </Link>
        </div>

        {/* ── Next steps ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3 sm:mb-4">
            Siguientes pasos
          </p>
          <ul className="space-y-3">
            {[
              'Creá un nuevo tenant para un cliente beta.',
              'Revisá o editá la información desde /admin/tenants.',
              'Ingresá como cliente para verificar la experiencia de onboarding.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
                <span className="mt-0.5 font-mono text-[11px] text-zinc-300 w-4 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}