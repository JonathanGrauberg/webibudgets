// app/api/calendar-events/overlay/route.ts
//
// "Ver info de .budgets" — capa de solo lectura que superpone al
// calendario propio los vencimientos de presupuestos y las fechas de
// cobro ya registrados en el sistema. No son anotaciones (no viven en
// CalendarEvent, no se pueden editar ni borrar desde acá) — se calculan
// al vuelo cada vez que se pide.
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { canAccessRoute } from '@/lib/permissions'

export interface OverlayItem {
  id: string
  type: 'budget_due' | 'cobro_paid'
  date: string // ISO
  title: string
  href: string
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined
  if (!tenantId || !canAccessRoute(role, 'calendar')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (!from || !to) {
    return NextResponse.json({ error: 'Faltan from/to' }, { status: 400 })
  }
  const range = { gte: new Date(from), lte: new Date(to) }

  const [budgetsDue, cobrosPaid] = await Promise.all([
    prisma.budget.findMany({
      where: { tenantId, active: true, status: { in: ['sent', 'approved'] }, validUntil: range },
      select: { id: true, budgetNumber: true, validUntil: true, client: { select: { name: true, company: true } } },
    }),
    prisma.cobro.findMany({
      where: { tenantId, status: 'paid', paidAt: range },
      select: { id: true, amount: true, currency: true, paidAt: true, client: { select: { name: true, company: true } } },
    }),
  ])

  const items: OverlayItem[] = [
    ...budgetsDue.map((b) => ({
      id: `budget_due:${b.id}`,
      type: 'budget_due' as const,
      date: (b.validUntil as Date).toISOString(),
      title: `Vence presupuesto #${String(b.budgetNumber ?? 0).padStart(6, '0')} — ${b.client?.company || b.client?.name || '—'}`,
      href: `/budgets/${b.id}`,
    })),
    ...cobrosPaid.map((c) => ({
      id: `cobro_paid:${c.id}`,
      type: 'cobro_paid' as const,
      date: (c.paidAt as Date).toISOString(),
      title: `Cobro recibido — ${c.client?.company || c.client?.name || '—'} (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: c.currency, maximumFractionDigits: 0 }).format(c.amount)})`,
      href: `/cobros`,
    })),
  ]

  return NextResponse.json(items)
}
