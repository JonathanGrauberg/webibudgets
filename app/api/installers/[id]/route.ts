import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const data = await request.json()

    const installer = await prisma.installer.update({
      where: { id },
      data: {
        name: data.name !== undefined ? String(data.name).trim() : undefined,
        lastName: data.lastName !== undefined ? String(data.lastName).trim() : undefined,
        phone: data.phone !== undefined ? String(data.phone).trim() : undefined,
        email: data.email !== undefined ? (data.email ? String(data.email).trim() : null) : undefined,
        city: data.city !== undefined ? (data.city ? String(data.city).trim() : null) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined,
      },
    })

    return NextResponse.json(installer)
  } catch (error) {
    console.error('Update installer error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Soft delete: active=false
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params

    const installer = await prisma.installer.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json(installer)
  } catch (error) {
    console.error('Disable installer error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}