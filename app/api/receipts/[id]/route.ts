import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const { id } = await params
    const data = await request.json()

    if (data.status !== 'voided') {
      return NextResponse.json({ error: 'Solo se admite anular un recibo' }, { status: 400 })
    }

    const result = await prisma.receipt.updateMany({
      where: { id, tenantId },
      data: { status: 'voided' },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Recibo no encontrado' }, { status: 404 })
    }

    const updated = await prisma.receipt.findFirst({ where: { id, tenantId } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error voiding receipt:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}