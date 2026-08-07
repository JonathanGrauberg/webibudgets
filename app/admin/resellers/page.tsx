// app/admin/resellers/page.tsx
import { prisma } from '@/lib/prisma'
import { ResellersTable } from '@/components/admin/resellers-table'

export const dynamic = 'force-dynamic'

export default async function AdminResellersPage() {
  const codes = await prisma.resellerCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenants: {
        select: { id: true, name: true, plan: true, proBillingInterval: true },
      },
    },
  })

  // 👇 nuevo — serializamos Date a string antes de pasarlo al client component
  const serialized = codes.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Revendedores</h2>
        <p className="mt-2 text-slate-600">Códigos de descuento y comisiones a pagar</p>
      </div>
      <ResellersTable initialCodes={serialized} /> {/* 👈 antes: codes */}
    </div>
  )
}