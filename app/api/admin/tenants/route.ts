import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isOwnerRole } from '@/lib/admin'

const DEFAULT_BRANDING = {
  logoUrl: '/placeholder-logo.png',
  primaryColor: '#0F172A',
  secondaryColor: '#334155',
  accentColor: '#F59E0B',
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOwnerRole(token.role as string | undefined)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxUsers: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ tenants })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOwnerRole(token.role as string | undefined)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { companyName, slug, adminEmail, password, plan, maxUsers } = body ?? {}

  if (!companyName || !slug || !adminEmail || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
      slug,
      plan: plan || 'free',
      maxUsers: Number(maxUsers) || 5,
      active: true,
      ...DEFAULT_BRANDING,
      users: {
        create: {
          name: `${companyName} Admin`,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          active: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxUsers: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ tenant })
}
