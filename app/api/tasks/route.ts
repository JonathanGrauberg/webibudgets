import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhere, tenantCreateData } from '@/lib/tenant'

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)
  const { searchParams } = new URL(request.url)
  const kioskBoardId = searchParams.get('kioskBoardId') // 👈 nuevo

  const tasks = await prisma.task.findMany({
    where: {
      ...tenantWhere(tenantId),
      ...(kioskBoardId ? { kioskBoardId } : {}), // 👈 nuevo — si no viene, trae todas (comportamiento viejo intacto)
    },
    orderBy: [{ column: 'asc' }, { order: 'asc' }],
  })
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }

    const column = data.column ?? 'backlog'
    const kioskBoardId = data.kioskBoardId || null // 👈 nuevo

    const lastInColumn = await prisma.task.findFirst({
      where: { tenantId, column, kioskBoardId }, // 👈 el orden es independiente por tablero
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const task = await prisma.task.create({
      data: tenantCreateData(
        {
          title: data.title.trim(),
          description: data.description || null,
          column,
          order: (lastInColumn?.order ?? -1) + 1,
          linkType: data.linkType || null,
          linkId: data.linkId || null,
          createdByUserId: data.createdByUserId || null,
          kioskBoardId, // 👈 nuevo
          priority: data.priority ?? 'medium', // 👈 nuevo
        },
        tenantId
      ),
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}