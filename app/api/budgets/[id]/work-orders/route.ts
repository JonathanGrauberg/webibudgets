import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const workOrders = await prisma.workOrder.findMany({
    where: { budgetId: id, tenantId },
    include: { assignedToUser: true, checklist: { orderBy: { order: 'asc' } } },
    orderBy: { workOrderNumber: 'desc' },
  })

  return NextResponse.json(workOrders)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { features: true, workOrderSequence: true },
    })

    if (!hasFeature({ features: tenant?.features }, 'vouchers')) {
      return NextResponse.json({ error: 'Módulo de documentos no habilitado' }, { status: 403 })
    }

    const budget = await prisma.budget.findFirst({ where: tenantWhereId(id, tenantId) })
    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    const workOrderNumber = tenant!.workOrderSequence

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { workOrderSequence: { increment: 1 } },
    })

    const checklistInput: string[] = Array.isArray(data.checklist) ? data.checklist : []

    const workOrder = await prisma.workOrder.create({
      data: {
        tenantId,
        budgetId: id,
        workOrderNumber,
        title: data.title || null,
        description: data.description || null,
        assignedToUserId: data.assignedToUserId || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        estimatedHours: data.estimatedHours ?? null,
        notes: data.notes || null,
        registeredByUserId: data.registeredByUserId || null,
        checklist: {
          create: checklistInput
            .filter((label) => label && label.trim().length > 0)
            .map((label, index) => ({ label: label.trim(), order: index })),
        },
      },
      include: { checklist: true, assignedToUser: true },
    })

    return NextResponse.json(workOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating work order:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}