// app/api/expense-categories/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest, tenantWhere, tenantCreateData } from '@/lib/tenant'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: Request) {
  const tenantId = await getTenantIdFromRequest(request)
  const categories = await prisma.tenantExpenseCategory.findMany({
    where: tenantWhere(tenantId),
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const data = await request.json()

    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const name = data.name.trim()
    let slug = slugify(name)

    const existing = await prisma.tenantExpenseCategory.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 })
    }

    const category = await prisma.tenantExpenseCategory.create({
      data: tenantCreateData({ name, slug }, tenantId),
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating expense category:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}