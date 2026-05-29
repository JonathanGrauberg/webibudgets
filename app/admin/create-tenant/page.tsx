import CreateTenantForm from '@/components/admin/create-tenant-form'

export default function AdminCreateTenantPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Crear tenant</p>
        <h2 className="mt-2 text-3xl font-semibold">Onboarding manual para clientes</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">Completa los datos de la empresa y el usuario administrador para iniciar un onboarding real.</p>
      </div>

      <CreateTenantForm />
    </div>
  )
}
