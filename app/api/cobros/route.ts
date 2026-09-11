//app\api\cobros\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'
import { parsePeriodMonth } from '@/lib/cobro-period'

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)
  const { searchParams } = new URL(request.url)
  const periodParam = searchParams.get('period') // "YYYY-MM", opcional

  const cobros = await prisma.cobro.findMany({
    where: {
      tenantId,
      ...(periodParam ? { periodMonth: parsePeriodMonth(periodParam) } : {}),
    },
    orderBy: [{ periodMonth: 'desc' }, { cobroNumber: 'desc' }],
    include: {
      client: { select: { id: true, name: true, company: true } },
    },
  })

  return NextResponse.json(cobros)
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!data.clientId) {
      return NextResponse.json({ error: 'Falta seleccionar un cliente' }, { status: 400 })
    }
    if (!data.concept || !String(data.concept).trim()) {
      return NextResponse.json({ error: 'Falta el concepto' }, { status: 400 })
    }
    if (!data.amount || Number(data.amount) <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }
    if (!data.periodMonth) {
      return NextResponse.json({ error: 'Falta el período (mes)' }, { status: 400 })
    }

    const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } })
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado o no pertenece al tenant' }, { status: 404 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { cobroSequence: true, currency: true } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    const cobroNumber = tenant.cobroSequence
    await prisma.tenant.update({ where: { id: tenantId }, data: { cobroSequence: { increment: 1 } } })

    const cobro = await prisma.cobro.create({
      data: {
        tenantId,
        clientId: data.clientId,
        cobroNumber,
        concept: String(data.concept).trim(),
        amount: Number(data.amount),
        currency: data.currency || tenant.currency,
        periodMonth: parsePeriodMonth(data.periodMonth),
        notes: data.notes || null,
      },
      include: { client: { select: { id: true, name: true, company: true } } },
    })

    return NextResponse.json(cobro, { status: 201 })
  } catch (error) {
    console.error('Error creating cobro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
