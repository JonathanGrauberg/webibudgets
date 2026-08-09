//app\api\tasks\reorder\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!Array.isArray(data.updates)) {
      return NextResponse.json({ error: 'updates debe ser un array' }, { status: 400 })
    }

    await prisma.$transaction(
      data.updates.map((u: { id: string; column: string; order: number }) =>
        prisma.task.updateMany({
          where: { id: u.id, tenantId },
          data: { column: u.column as any, order: u.order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}