// app\admin\tenants\page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminTenantsTable from '@/components/admin/admin-tenants-table'

// 🔥 Forzamos a Next.js a que NO cachee esta página y consulte la DB en vivo en cada visita
export const dynamic = 'force-dynamic'

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxUsers: true,
      trialEndsAt: true,
      active: true,
      createdAt: true,
    },
  })

  // Serializamos fechas a string para pasarlas a un client component
  const serialized = tenants.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[-0.5] text-primary">Tenants</p>
          <h2 className="text-3xl font-semibold tracking-[-1]">Listado de tenants</h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">Revisa y administra los tenants creados por el equipo de Webi Studio.</p>
        </div>
        <Link href="/admin/create-tenant" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
          Nuevo tenant
        </Link>
      </div>

      <AdminTenantsTable initialTenants={serialized} />
    </div>
  )
}