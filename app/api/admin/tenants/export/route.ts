// app/api/admin/tenants/export/route.ts
//
// Exporta a CSV los negocios registrados con los datos de contacto y de uso
// que ayudan a identificar quién usa el sistema. Solo para el rol owner.
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { isOwnerRole } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const SEP = ';' // separador de lista de Excel en español

function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = value instanceof Date ? value.toISOString().slice(0, 16).replace('T', ' ') : String(value)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !isOwnerRole(token.role as string | undefined)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      plan: true,
      active: true,
      createdAt: true,
      trialEndsAt: true,
      email: true,
      phone: true,
      address: true,
      website: true,
      mpConnected: true,
      signupCountry: true,
      signupReferrer: true,
      _count: { select: { users: true, budgets: true, clients: true, products: true, receipts: true } },
      users: {
        orderBy: { createdAt: 'asc' },
        select: { name: true, email: true, role: true, emailVerified: true, lastLoginAt: true },
      },
      budgets: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
    },
  })

  const header = [
    'Negocio', 'Responsable', 'Email del usuario', 'Email del negocio', 'Teléfono', 'Dirección', 'Web',
    'Plan', 'Activo', 'Alta', 'Prueba hasta', 'Email verificado', 'Último ingreso', 'Último presupuesto',
    'Usuarios', 'Presupuestos', 'Clientes', 'Productos', 'Recibos', 'Mercado Pago conectado', 'País de alta', 'Vino desde',
  ]

  const rows = tenants.map((t) => {
    const owner = t.users.find((u) => u.role === 'admin' || u.role === 'owner') ?? t.users[0]
    const lastLogin = t.users.reduce<Date | null>((acc, u) => (u.lastLoginAt && (!acc || u.lastLoginAt > acc) ? u.lastLoginAt : acc), null)
    return [
      t.name, owner?.name, owner?.email, t.email, t.phone, t.address, t.website,
      t.plan, t.active ? 'Sí' : 'No', t.createdAt, t.trialEndsAt, owner?.emailVerified ? 'Sí' : 'No', lastLogin, t.budgets[0]?.createdAt,
      t._count.users, t._count.budgets, t._count.clients, t._count.products, t._count.receipts,
      t.mpConnected ? 'Sí' : 'No', t.signupCountry, t.signupReferrer,
    ].map(cell).join(SEP)
  })

  const csv = '﻿' + [header.join(SEP), ...rows].join('\r\n')
  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="negocios-budgets-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
