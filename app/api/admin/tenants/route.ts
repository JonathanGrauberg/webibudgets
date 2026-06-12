//app\api\admin\tenants\route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isOwnerRole } from '@/lib/admin'
import {
  isValidPlan,
  resolveMaxUsers,
  resolveTrialEndsAt,
} from '@/lib/plan'

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
    select: TENANT_SELECT,
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
  const { companyName, slug, adminEmail, password, plan: rawPlan } = body ?? {}

  if (!companyName || !slug || !adminEmail || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const plan = isValidPlan(rawPlan) ? rawPlan : 'free'

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
      trialEndsAt: resolveTrialEndsAt(plan),
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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOwnerRole(token.role as string | undefined)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { id, plan: rawPlan, active, maxUsers: rawMaxUsers, trialEndsAt: rawTrialEndsAt } = body ?? {}

  if (!id) {
    return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 })
  }

  const existing = await prisma.tenant.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  // Plan: si cambia, recalculamos maxUsers según el plan (salvo override manual)
  let plan: string | undefined
  if (rawPlan !== undefined) {
    if (!isValidPlan(rawPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    plan = rawPlan
    data.plan = plan
    data.maxUsers = resolveMaxUsers(plan)
  }

  // Override manual de maxUsers (tiene prioridad sobre el cálculo automático)
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

  // trialEndsAt: permite extender/editar manualmente, o limpiar enviando null
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
  } else if (plan && plan !== existing.plan) {
    // Si cambia el plan y no se especificó trialEndsAt explícitamente,
    // recalculamos según las reglas del nuevo plan.
    data.trialEndsAt = resolveTrialEndsAt(plan, existing.createdAt)
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data,
    select: TENANT_SELECT,
  })

  return NextResponse.json({ tenant })
}