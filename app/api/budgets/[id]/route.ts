import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing budget id param' },
      { status: 400 }
    )
  }

  try {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        client: true,
        seller: true,
        installer: true,
        items: {
          include: {
            productService: true,
          },
        },
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing budget id param' },
      { status: 400 }
    )
  }

  try {
    const data = await request.json()

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        total: data.total,
      },
      include: {
        client: true,
        seller: true,
        installer: true,
        items: {
          include: {
            productService: true,
          },
        },
      },
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: 'Missing budget id param' },
      { status: 400 }
    )
  }

  try {
    await prisma.budget.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}