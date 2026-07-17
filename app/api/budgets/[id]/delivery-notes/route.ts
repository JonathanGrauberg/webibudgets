import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const deliveryNotes = await prisma.deliveryNote.findMany({
    where: { budgetId: id, tenantId },
    orderBy: { deliveryNumber: 'desc' },
  })

  return NextResponse.json(deliveryNotes)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { features: true, deliveryNoteSequence: true },
    })

    if (!hasFeature({ features: tenant?.features }, 'vouchers')) {
      return NextResponse.json({ error: 'Módulo de documentos no habilitado' }, { status: 403 })
    }

    const budget = await prisma.budget.findFirst({ where: tenantWhereId(id, tenantId) })
    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    const deliveryNumber = tenant!.deliveryNoteSequence

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { deliveryNoteSequence: { increment: 1 } },
    })

    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        tenantId,
        budgetId: id,
        deliveryNumber,
        vehicle: data.vehicle || null,
        driverName: data.driverName || null,
        licensePlate: data.licensePlate || null,
        carrierCompany: data.carrierCompany || null,
        receivedByName: data.receivedByName || null,
        receivedByDni: data.receivedByDni || null,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
        notes: data.notes || null,
        registeredByUserId: data.registeredByUserId || null,
      },
    })

    return NextResponse.json(deliveryNote, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery note:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}