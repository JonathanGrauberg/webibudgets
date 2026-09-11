//app\api\budgets\[id]\followups\route.ts
//
// Mini-CRM de seguimiento por presupuesto — registro de llamadas/mensajes,
// independiente del cambio de estado (ver BudgetStatusHistory, que es otra cosa).
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const budget = await prisma.budget.findFirst({ where: tenantWhereId(id, tenantId), select: { id: true } })
  if (!budget) {
    return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
  }

  const followups = await prisma.budgetFollowup.findMany({
    where: { budgetId: id, tenantId },
    orderBy: { contactedAt: 'desc' },
  })

  return NextResponse.json(followups)
}

const VALID_CHANNELS = ['whatsapp', 'llamada', 'email', 'presencial', 'otro']

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json().catch(() => ({}))

    if (!data.note || !String(data.note).trim()) {
      return NextResponse.json({ error: 'Falta la nota del seguimiento' }, { status: 400 })
    }

    const budget = await prisma.budget.findFirst({ where: tenantWhereId(id, tenantId), select: { id: true } })
    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const registeredBy = (token?.name as string | undefined) || (token?.email as string | undefined) || null

    const followup = await prisma.budgetFollowup.create({
      data: {
        tenantId,
        budgetId: id,
        note: String(data.note).trim(),
        channel: VALID_CHANNELS.includes(data.channel) ? data.channel : null,
        contactedAt: data.contactedAt ? new Date(data.contactedAt) : new Date(),
        registeredBy,
      },
    })

    return NextResponse.json(followup, { status: 201 })
  } catch (error) {
    console.error('Error creating budget followup:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
