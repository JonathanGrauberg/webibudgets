import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Por defecto: solo activos
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const sellers = await prisma.seller.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(sellers)
  } catch (error) {
    console.error('Get sellers error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validación mínima (podés endurecer después)
    if (!data?.name || !data?.lastName) {
      return NextResponse.json(
        { error: 'name y lastName son obligatorios' },
        { status: 400 }
      )
    }

    const seller = await prisma.seller.create({
      data: {
        name: String(data.name).trim(),
        lastName: String(data.lastName).trim(),
        dni: data.dni ? String(data.dni).trim() : null,
        email: data.email ? String(data.email).trim() : null,
        phone: data.phone ? String(data.phone).trim() : null,
        address: data.address ? String(data.address).trim() : null,
        city: data.city ? String(data.city).trim() : null,
        province: data.province ? String(data.province).trim() : null,
        sector: data.sector ? String(data.sector).trim() : null,
        active: typeof data.active === 'boolean' ? data.active : true,
      },
    })

    return NextResponse.json(seller, { status: 201 })
  } catch (error) {
    console.error('Create seller error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
