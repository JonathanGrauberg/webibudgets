// app/admin/tenants/[id]/page.tsx
//
// Ficha completa de un negocio (solo owner, protegido por el middleware de /admin):
// quién es, cómo contactarlo, de dónde vino y cuánto usa el sistema. No muestra
// datos de los clientes finales de ese negocio ni montos.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmt(d?: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(d)
}

function ago(d?: Date | null) {
  if (!d) return ''
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  return `hace ${days} días`
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm text-slate-900">{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

export default async function AdminTenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true, lastLoginAt: true } },
      referralCode: { select: { code: true, resellerName: true, discountPercent: true } },
      arcaCredential: { select: { id: true } },
      budgets: { orderBy: { createdAt: 'desc' }, take: 8, select: { budgetNumber: true, status: true, createdAt: true } },
    },
  })
  if (!tenant) notFound()

  const [byStatus, clients, products, receipts, deliveryNotes, workOrders, expenses, cobros, tasks, events, sellers, installers, kiosk, lastReceipt, lastClient] = await Promise.all([
    prisma.budget.groupBy({ by: ['status'], where: { tenantId: id }, _count: { _all: true } }),
    prisma.client.count({ where: { tenantId: id } }),
    prisma.productService.count({ where: { tenantId: id } }),
    prisma.receipt.count({ where: { tenantId: id } }),
    prisma.deliveryNote.count({ where: { tenantId: id } }),
    prisma.workOrder.count({ where: { tenantId: id } }),
    prisma.expense.count({ where: { tenantId: id } }),
    prisma.cobro.count({ where: { tenantId: id } }),
    prisma.task.count({ where: { tenantId: id } }),
    prisma.calendarEvent.count({ where: { tenantId: id } }),
    prisma.seller.count({ where: { tenantId: id } }),
    prisma.installer.count({ where: { tenantId: id } }),
    prisma.kioskBoard.count({ where: { tenantId: id } }),
    prisma.receipt.findFirst({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.client.findFirst({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ])

  const budgetsTotal = byStatus.reduce((acc, s) => acc + s._count._all, 0)
  const lastLogin = tenant.users.reduce<Date | null>((acc, u) => (u.lastLoginAt && (!acc || u.lastLoginAt > acc) ? u.lastLoginAt : acc), null)
  const features = (tenant.features ?? {}) as Record<string, boolean>
  const activeFeatures = Object.entries(features).filter(([, v]) => v).map(([k]) => k)

  const usage: [string, number][] = [
    ['Presupuestos', budgetsTotal], ['Clientes', clients], ['Productos / servicios', products], ['Recibos', receipts],
    ['Remitos', deliveryNotes], ['Órdenes de trabajo', workOrders], ['Gastos', expenses], ['Cobros', cobros],
    ['Tareas', tasks], ['Eventos de calendario', events], ['Vendedores', sellers], ['Instaladores', installers], ['Tableros Kiosco', kiosk],
  ]

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/tenants" className="text-sm text-slate-500 hover:text-slate-900">← Volver a tenants</Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">Ficha del negocio</p>
        <h2 className="text-3xl font-semibold tracking-tight">{tenant.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Plan <b>{tenant.plan ?? 'free'}</b> · {tenant.active ? 'Activo' : 'Inactivo'} · Alta {fmt(tenant.createdAt)} ({ago(tenant.createdAt)}) · Último ingreso {fmt(lastLogin)} {lastLogin ? `(${ago(lastLogin)})` : ''}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="Contacto">
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Email del negocio" value={tenant.email} />
            <Field label="Teléfono" value={tenant.phone} />
            <Field label="Dirección" value={tenant.address} />
            <Field label="Web" value={tenant.website} />
            <Field label="Moneda" value={tenant.currency} />
            <Field label="Slug" value={<span className="font-mono">{tenant.slug}</span>} />
          </div>
        </Section>

        <Section title="Cómo llegó">
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="País de alta" value={tenant.signupCountry} />
            <Field label="Vino desde" value={tenant.signupReferrer} />
            <Field
              label="Código de revendedor"
              value={tenant.referralCode ? `${tenant.referralCode.code} (${tenant.referralCode.resellerName}, ${tenant.referralCode.discountPercent}%)` : null}
            />
            <Field label="Prueba hasta" value={tenant.trialEndsAt ? fmt(tenant.trialEndsAt) : null} />
          </div>
          <Field label="Dispositivo / navegador" value={<span className="text-xs">{tenant.signupUserAgent}</span>} />
        </Section>
      </div>

      <Section title={`Usuarios (${tenant.users.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-widest text-slate-400">
              <tr><th className="py-2 pr-4">Nombre</th><th className="pr-4">Email</th><th className="pr-4">Rol</th><th className="pr-4">Alta</th><th className="pr-4">Email verificado</th><th>Último ingreso</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenant.users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 pr-4 font-medium">{u.name}</td>
                  <td className="pr-4">{u.email}</td>
                  <td className="pr-4">{u.role}</td>
                  <td className="pr-4">{fmt(u.createdAt)}</td>
                  <td className="pr-4">{u.emailVerified ? `Sí (${fmt(u.emailVerified)})` : 'No'}</td>
                  <td>{fmt(u.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="Uso del sistema">
          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {usage.map(([label, n]) => <Field key={label} label={label} value={n} />)}
          </div>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Presupuestos por estado</p>
            <p className="mt-1 text-sm text-slate-900">
              {byStatus.length === 0 ? '—' : byStatus.map((s) => `${s.status}: ${s._count._all}`).join(' · ')}
            </p>
          </div>
        </Section>

        <Section title="Actividad reciente">
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Último presupuesto" value={tenant.budgets[0] ? `${fmt(tenant.budgets[0].createdAt)} (${ago(tenant.budgets[0].createdAt)})` : null} />
            <Field label="Último recibo" value={lastReceipt ? fmt(lastReceipt.createdAt) : null} />
            <Field label="Último cliente cargado" value={lastClient ? fmt(lastClient.createdAt) : null} />
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Últimos presupuestos</p>
          <ul className="mt-1 space-y-1 text-sm">
            {tenant.budgets.length === 0 && <li className="text-slate-500">Todavía no creó presupuestos.</li>}
            {tenant.budgets.map((b) => (
              <li key={b.budgetNumber} className="flex justify-between gap-3">
                <span className="font-mono">#{String(b.budgetNumber ?? 0).padStart(6, '0')} · {b.status}</span>
                <span className="text-slate-500">{fmt(b.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Configuración y funciones">
        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
          <Field label="Logo propio" value={tenant.logoUrl && !tenant.logoUrl.includes('placeholder') ? 'Sí' : 'No'} />
          <Field label="PDF de condiciones" value={tenant.conditionsPdfName ?? 'No'} />
          <Field label="Mercado Pago conectado" value={tenant.mpConnected ? 'Sí' : 'No'} />
          <Field label="Facturación ARCA" value={tenant.arcaCredential ? 'Configurada' : 'No'} />
          <Field label="Máx. usuarios" value={tenant.maxUsers} />
          <Field label="Plantilla de PDF" value={tenant.pdfTemplate} />
        </div>
        <Field label="Funciones habilitadas manualmente" value={activeFeatures.length ? activeFeatures.join(', ') : 'Ninguna (según plan)'} />
      </Section>
    </div>
  )
}
