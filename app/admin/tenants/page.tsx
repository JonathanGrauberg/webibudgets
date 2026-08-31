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
      features: true,
      // 👇 metadata de alta — soporte/seguridad, ver prisma/schema.prisma
      signupCountry: true,
      signupReferrer: true,
      signupUserAgent: true,
      // 👇 nuevo — conteos reales, sin traer las filas completas de usuarios/presupuestos
      _count: {
        select: {
          users: true,
          budgets: true,
        },
      },
      // 👇 último login de cualquier usuario del tenant, y último presupuesto creado —
      // solo traemos 1 fila ordenada, no la lista completa
      users: {
        select: { lastLoginAt: true },
        orderBy: { lastLoginAt: 'desc' },
        take: 1,
      },
      budgets: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  // Serializamos fechas a string para pasarlas a un client component
  const serialized = tenants.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
    // 👈 Prisma tipa Json como JsonValue (más amplio); nuestro propio endpoint de
    // features es el único que escribe este campo y siempre guarda un objeto de
    // booleans, así que el cast acá es seguro.
    features: t.features as Record<string, boolean> | null,
    userCount: t._count.users, // 👈 nuevo — aplanamos el _count.users a un campo simple
    budgetCount: t._count.budgets, // 👈 nuevo
    lastLoginAt: t.users[0]?.lastLoginAt ? t.users[0].lastLoginAt.toISOString() : null,
    lastBudgetAt: t.budgets[0]?.createdAt ? t.budgets[0].createdAt.toISOString() : null,
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