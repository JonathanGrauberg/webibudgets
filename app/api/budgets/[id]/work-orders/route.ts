import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhereId } from '@/lib/tenant'
import { hasFeature } from '@/lib/features'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const workOrders = await prisma.workOrder.findMany({
    where: { budgetId: id, tenantId },
    include: {
      assignedToUser: true,
      checklist: { orderBy: { order: 'asc' } },
      materials: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
      tools: { orderBy: { order: 'asc' } },
      helpers: { include: { user: true } },
    },
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

    const budget = await prisma.budget.findFirst({
      where: tenantWhereId(id, tenantId),
      include: { items: { include: { productService: true } } },
    })
    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    const workOrderNumber = tenant!.workOrderSequence

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { workOrderSequence: { increment: 1 } },
    })

    const checklistInput: string[] = Array.isArray(data.checklist) ? data.checklist : []
    const tasksInput: string[] = Array.isArray(data.tasks) ? data.tasks : []
    const toolsInput: string[] = Array.isArray(data.tools) ? data.tools : []
    const helperUserIds: string[] = Array.isArray(data.helperUserIds) ? data.helperUserIds : []

    // Materiales: si no vienen explícitos, se autocompletan desde los ítems del presupuesto
    const materialsInput: { productServiceId?: string | null; customName?: string | null; quantity: number; unit?: string | null }[] =
      Array.isArray(data.materials) && data.materials.length > 0
        ? data.materials
        : budget.items.map((item) => ({
            productServiceId: item.productServiceId ?? null,
            customName: item.customName ?? item.productService?.name ?? null,
            quantity: item.quantity,
            unit: item.productService?.unit ?? null,
          }))

    const workOrder = await prisma.workOrder.create({
      data: {
        tenantId,
        budgetId: id,
        workOrderNumber,
        title: data.title || null,
        description: data.description || null,
        priority: data.priority || 'medium',
        assignedToUserId: data.assignedToUserId || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        scheduledTimeFrom: data.scheduledTimeFrom || null,
        scheduledTimeTo: data.scheduledTimeTo || null,
        estimatedHours: data.estimatedHours ?? null,
        branch: data.branch || null,
        notes: data.notes || null,
        registeredByUserId: data.registeredByUserId || null,
        checklist: {
          create: checklistInput.filter((l) => l?.trim()).map((label, i) => ({ label: label.trim(), order: i })),
        },
        tasks: {
          create: tasksInput.filter((l) => l?.trim()).map((label, i) => ({ label: label.trim(), order: i })),
        },
        tools: {
          create: toolsInput.filter((l) => l?.trim()).map((label, i) => ({ label: label.trim(), order: i })),
        },
        materials: {
          create: materialsInput
            .filter((m) => m.customName || m.productServiceId)
            .map((m, i) => ({
              productServiceId: m.productServiceId || null,
              customName: m.customName || null,
              quantity: m.quantity ?? 1,
              unit: m.unit || null,
              order: i,
            })),
        },
        helpers: {
          create: helperUserIds.filter(Boolean).map((userId) => ({ userId })),
        },
      },
      include: {
        checklist: true, tasks: true, tools: true, materials: true,
        helpers: { include: { user: true } }, assignedToUser: true,
      },
    })

    return NextResponse.json(workOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating work order:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}