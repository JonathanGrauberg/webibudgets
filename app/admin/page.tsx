import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminPage() {
  const totalTenants = await prisma.tenant.count()
  const totalUsers = await prisma.user.count()

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Panel Admin</p>
            <h2 className="mt-2 text-3xl font-semibold">Bienvenido a Webi Studio</h2>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
              Administra tenants, crea cuentas iniciales y gestiona el onboarding de tus clientes dentro del mismo sistema.
            </p>
          </div>
          <Link href="/admin/create-tenant" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
            Crear nuevo tenant
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tenants registrados</p>
          <p className="mt-6 text-5xl font-semibold">{totalTenants}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Tenants activos y configurados en el sistema.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Usuarios totales</p>
          <p className="mt-6 text-5xl font-semibold">{totalUsers}</p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Cuentas de clientes y administradores creados en el sistema.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        <h3 className="text-xl font-semibold">Siguientes pasos</h3>
        <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <li>• Crea un nuevo tenant para un cliente beta.</li>
          <li>• Revisa o edita la información de tenant desde /admin/tenants.</li>
          <li>• Ingresa como cliente para verificar la experiencia de onboarding.</li>
        </ul>
      </section>
    </div>
  )
}
