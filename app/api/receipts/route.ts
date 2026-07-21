// app/api/receipts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

// GET: Obtener todos los recibos del tenant
export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    const receipts = await prisma.receipt.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        budget: {
          select: {
            id: true,
            budgetNumber: true,
          },
        },
      },
    })

    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST: Crear un nuevo recibo
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const body = await request.json()

    const newReceipt = await prisma.receipt.create({
      data: {
        ...body,
        tenantId,
      },
    })

    return NextResponse.json(newReceipt, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}