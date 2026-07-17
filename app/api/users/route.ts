import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    const users = await prisma.user.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}