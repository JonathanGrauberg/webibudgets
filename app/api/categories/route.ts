import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantCreateData, tenantWhere } from '@/lib/tenant'
import { slugify } from '@/lib/categories'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const categories = await prisma.tenantProductCategory.findMany({
      where: tenantWhere(tenantId),
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()
    const name = typeof data.name === 'string' ? data.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const slug = slugify(name)

    // Si ya existe para este tenant, devolvemos la existente en vez de duplicar
    const existing = await prisma.tenantProductCategory.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    })
    if (existing) return NextResponse.json(existing)

    const created = await prisma.tenantProductCategory.create({
      data: tenantCreateData({ name, slug }, tenantId),
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}