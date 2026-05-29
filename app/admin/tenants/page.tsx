import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxUsers: true,
      active: true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Tenants</p>
          <h2 className="mt-2 text-3xl font-semibold">Listado de tenants</h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">Revisa y administra los tenants creados por el equipo de Webi Studio.</p>
        </div>
        <Link href="/admin/create-tenant" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
          Nuevo tenant
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Max usuarios</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{tenant.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tenant.slug}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tenant.plan || 'free'}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tenant.maxUsers}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{tenant.active ? 'Activo' : 'Inactivo'}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{new Date(tenant.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
