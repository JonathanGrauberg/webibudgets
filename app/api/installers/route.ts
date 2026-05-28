import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Por defecto: solo activos
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const installers = await prisma.installer.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(installers)
  } catch (error) {
    console.error('Get installers error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data?.name || !data?.lastName || !data?.phone) {
      return NextResponse.json(
        { error: 'name, lastName y phone son obligatorios' },
        { status: 400 }
      )
    }

    const installer = await prisma.installer.create({
      data: {
        name: String(data.name).trim(),
        lastName: String(data.lastName).trim(),
        phone: String(data.phone).trim(),
        email: data.email ? String(data.email).trim() : null,
        city: data.city ? String(data.city).trim() : null,
        active: typeof data.active === 'boolean' ? data.active : true,
      },
    })

    return NextResponse.json(installer, { status: 201 })
  } catch (error) {
    console.error('Create installer error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}