// app/api/admin/tenants/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isOwnerRole } from '@/lib/admin'
import { isValidPlan, resolveMaxUsers, resolveTrialEndsAt, normalizePlan } from '@/lib/plan'

const DEFAULT_BRANDING = {
  logoUrl: '/placeholder-logo.png',
  primaryColor: '#0F172A',
  secondaryColor: '#334155',
  accentColor: '#F59E0B',
}

const TENANT_SELECT = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  maxUsers: true,
  trialEndsAt: true,
  active: true,
  createdAt: true,
} as const

async function requireOwner(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  if (!isOwnerRole(token.role as string | undefined)) return null
  return token
}

export async function GET(req: NextRequest) {
  const token = await requireOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: TENANT_SELECT,
  })

  return NextResponse.json({ tenants })
}

export async function POST(req: NextRequest) {
  const token = await requireOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { companyName, slug, adminEmail, password, plan: rawPlan } = body ?? {}

  if (!companyName || !slug || !adminEmail || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const plan = isValidPlan(rawPlan) ? rawPlan : 'starter'

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
      slug,
      plan,
      maxUsers: resolveMaxUsers(plan),
      trialEndsAt: resolveTrialEndsAt(plan), // null para business, 14 días para starter/team
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
    select: TENANT_SELECT,
  })

  return NextResponse.json({ tenant })
}

export async function PUT(req: NextRequest) {
  const token = await requireOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const {
    id,
    plan: rawPlan,
    active,
    maxUsers: rawMaxUsers,
    trialEndsAt: rawTrialEndsAt,
  } = body ?? {}

  if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 })

  const existing = await prisma.tenant.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const data: Record<string, unknown> = {}

  // Plan: si cambia, recalculamos maxUsers según el nuevo plan
  if (rawPlan !== undefined) {
    if (!isValidPlan(rawPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    const planChanged = normalizePlan(rawPlan) !== normalizePlan(existing.plan)
    if (planChanged) {
      data.plan = rawPlan
      data.maxUsers = resolveMaxUsers(rawPlan)
      // No reiniciamos trialEndsAt si ya tiene uno activo — respetamos el trial en curso
      // Solo asignamos trialEndsAt si el nuevo plan tiene trial Y el tenant no tiene uno activo
      if (rawTrialEndsAt === undefined) {
        const existingTrialActive = existing.trialEndsAt && existing.trialEndsAt > new Date()
        if (!existingTrialActive) {
          data.trialEndsAt = resolveTrialEndsAt(rawPlan, existing.createdAt)
        }
      }
    }
  }

  // Override manual de maxUsers (tiene prioridad)
  if (rawMaxUsers !== undefined && rawMaxUsers !== null && rawMaxUsers !== '') {
    const parsed = Number(rawMaxUsers)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return NextResponse.json({ error: 'Invalid maxUsers' }, { status: 400 })
    }
    data.maxUsers = parsed
  }

  // active
  if (active !== undefined) {
    data.active = Boolean(active)
  }

  // trialEndsAt: edición manual explícita
  if (rawTrialEndsAt !== undefined) {
    if (rawTrialEndsAt === null || rawTrialEndsAt === '') {
      data.trialEndsAt = null
    } else {
      const parsedDate = new Date(rawTrialEndsAt)
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid trialEndsAt' }, { status: 400 })
      }
      data.trialEndsAt = parsedDate
    }
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data,
    select: TENANT_SELECT,
  })

  return NextResponse.json({ tenant })
}

export async function DELETE(req: NextRequest) {
  const token = await requireOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { id } = body ?? {}

  if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 })

  const existing = await prisma.tenant.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  // Soft delete: marcar como inactivo
  const tenant = await prisma.tenant.update({
    where: { id },
    data: { active: false },
    select: TENANT_SELECT,
  })

  return NextResponse.json({ tenant })
}