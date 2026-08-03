//app\api\work-orders\[id]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['paused', 'completed', 'cancelled'],
  paused: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
  voided: [],
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id } = await params

  const workOrder = await prisma.workOrder.findFirst({
    where: { id, tenantId },
    include: {
      checklist: { orderBy: { order: 'asc' } },
      materials: { orderBy: { order: 'asc' }, include: { productService: true } },
      tasks: { orderBy: { order: 'asc' } },
      tools: { orderBy: { order: 'asc' } },
      helpers: { include: { user: true } },
      assignedToUser: true,
      budget: { include: { client: true } },
    },
  })

  if (!workOrder) return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
  return NextResponse.json(workOrder)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    const current = await prisma.workOrder.findFirst({ where: { id, tenantId } })
    if (!current) return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })

    const updateData: any = {}

    if (data.status && data.status !== current.status) {
      if (data.status === 'voided') {
        if (current.status === 'voided') {
          return NextResponse.json({ error: 'La orden ya está anulada' }, { status: 400 })
        }
        updateData.status = 'voided'
      } else {
        const allowed = VALID_TRANSITIONS[current.status] ?? []
        if (!allowed.includes(data.status)) {
          return NextResponse.json({ error: `No se puede pasar de "${current.status}" a "${data.status}"` }, { status: 400 })
        }
        updateData.status = data.status
        if (data.status === 'in_progress' && !current.startedAt) updateData.startedAt = new Date()
        if (data.status === 'paused') updateData.pauseReason = data.pauseReason || null
        if (data.status === 'in_progress' && current.status === 'paused') updateData.pauseReason = null
        if (data.status === 'completed') {
          updateData.completedAt = new Date()
          if (current.startedAt && data.actualHours == null) {
            const ms = new Date().getTime() - new Date(current.startedAt).getTime()
            updateData.actualHours = Math.round((ms / 3600000) * 100) / 100
          }
        }
      }
    }

    for (const field of [
      'title', 'description', 'assignedToUserId', 'scheduledDate', 'scheduledTimeFrom',
      'scheduledTimeTo', 'estimatedHours', 'actualHours', 'notes', 'priority', 'branch', 'locationUrl',
    ]) {
      if (field in data) {
        updateData[field] = field === 'scheduledDate' && data[field] ? new Date(data[field]) : data[field]
      }
    }

    // Reemplazo completo de sub-listas cuando vienen en el body (edición desde el modal)
    if (Array.isArray(data.materials)) {
      updateData.materials = {
        deleteMany: {},
        create: data.materials.map((m: any, i: number) => ({
          productServiceId: m.productServiceId || null,
          customName: m.customName || null,
          quantity: m.quantity ?? 1,
          unit: m.unit || null,
          order: i,
        })),
      }
    }
    if (Array.isArray(data.tasks)) {
      updateData.tasks = {
        deleteMany: {},
        create: data.tasks.filter((l: string) => l?.trim()).map((label: string, i: number) => ({ label: label.trim(), order: i })),
      }
    }
    if (Array.isArray(data.helperUserIds)) {
      updateData.helpers = {
        deleteMany: {},
        create: data.helperUserIds.filter(Boolean).map((userId: string) => ({ userId })),
      }
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        checklist: { orderBy: { order: 'asc' } },
        materials: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { order: 'asc' } },
        tools: { orderBy: { order: 'asc' } },
        helpers: { include: { user: true } },
        assignedToUser: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating work order:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}