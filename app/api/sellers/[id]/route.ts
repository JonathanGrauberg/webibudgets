import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params // ✅ ESTE ES EL FIX REAL

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const data = await request.json()

    const seller = await prisma.seller.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        lastName: data.lastName !== undefined ? String(data.lastName).trim() : undefined,
        dni: data.dni !== undefined ? (data.dni ? String(data.dni).trim() : null) : undefined,
        email: data.email !== undefined ? (data.email ? String(data.email).trim() : null) : undefined,
        phone: data.phone !== undefined ? (data.phone ? String(data.phone).trim() : null) : undefined,
        address: data.address !== undefined ? (data.address ? String(data.address).trim() : null) : undefined,
        city: data.city !== undefined ? (data.city ? String(data.city).trim() : null) : undefined,
        province: data.province !== undefined ? (data.province ? String(data.province).trim() : null) : undefined,
        sector: data.sector !== undefined ? (data.sector ? String(data.sector).trim() : null) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined,
      },
    })

    return NextResponse.json(seller)
  } catch (error: any) {
    console.error('Update seller error FULL:', error)

    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
        code: error?.code || null,
        meta: error?.meta || null,
      },
      { status: 500 }
    )
  }
}

// ✅ DELETE corregido también
export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params // ✅ FIX

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    await prisma.seller.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Disable seller error FULL:', error)

    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}