// app/api/products/organizer/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function PATCH(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { serviceProductIds } = await request.json()

    if (!Array.isArray(serviceProductIds)) {
      return NextResponse.json({ error: 'serviceProductIds debe ser un array' }, { status: 400 })
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { serviceProductIds },
    })

    return NextResponse.json({ serviceProductIds: updated.serviceProductIds })
  } catch (error) {
    console.error('Error updating product organizer:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}