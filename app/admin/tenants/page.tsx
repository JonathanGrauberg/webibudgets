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
      // 👇 nuevo — si conectó su cuenta de Mercado Pago para cobrar online
      mpConnected: true,
      // 👇 nuevo — conteos reales, sin traer las filas completas de cada tabla
      _count: {
        select: {
          users: true,
          budgets: true,
          receipts: true,
          deliveryNotes: true,
          workOrders: true,
          budgetPayments: true,
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
    receiptCount: t._count.receipts,
    deliveryNoteCount: t._count.deliveryNotes,
    workOrderCount: t._count.workOrders,
    paymentCount: t._count.budgetPayments,
    lastLoginAt: t.users[0]?.lastLoginAt ? t.users[0].lastLoginAt.toISOString() : null,
    lastBudgetAt: t.budgets[0]?.createdAt ? t.budgets[0].createdAt.toISOString() : null,
  }))

  // 👇 nuevo — resumen de uso de toda la plataforma, de un vistazo (qué se
  // usa más, cuántos ya conectaron Mercado Pago, etc). Se calcula acá
  // mismo a partir de lo ya traído, sin pegarle otra consulta a la DB.
  const usageSummary = serialized.reduce(
    (acc, t) => ({
      activeTenants: acc.activeTenants + (t.active ? 1 : 0),
      mpConnectedTenants: acc.mpConnectedTenants + (t.mpConnected ? 1 : 0),
      budgets: acc.budgets + t.budgetCount,
      receipts: acc.receipts + t.receiptCount,
      deliveryNotes: acc.deliveryNotes + t.deliveryNoteCount,
      workOrders: acc.workOrders + t.workOrderCount,
      payments: acc.payments + t.paymentCount,
    }),
    { activeTenants: 0, mpConnectedTenants: 0, budgets: 0, receipts: 0, deliveryNotes: 0, workOrders: 0, payments: 0 }
  )

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

      {/* 👇 nuevo — resumen de uso de toda la plataforma */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: 'Tenants activos', value: usageSummary.activeTenants },
          { label: 'Con MP conectado', value: usageSummary.mpConnectedTenants },
          { label: 'Presupuestos', value: usageSummary.budgets },
          { label: 'Recibos', value: usageSummary.receipts },
          { label: 'Remitos', value: usageSummary.deliveryNotes },
          { label: 'Órdenes de trabajo', value: usageSummary.workOrders },
          { label: 'Pagos con MP', value: usageSummary.payments },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdminTenantsTable initialTenants={serialized} />
    </div>
  )
}