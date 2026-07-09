// app/api/admin/tenants/[id]/features/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { isOwnerRole } from '@/lib/admin'
import type { FeatureKey } from '@/lib/features'

const VALID_FEATURE_KEYS: FeatureKey[] = [
  'calculator',
  'commissions',
  'vouchers',
  'dashboardMetrics',
  'stockAnalytics',
]

async function requireOwner(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  if (!isOwnerRole(token.role as string | undefined)) return null
  return token
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await requireOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const body = await req.json().catch(() => null)

  if (!body || typeof body.features !== 'object' || body.features === null) {
    return NextResponse.json(
      { error: "Body inválido: se espera { features: {...} }" },
      { status: 400 }
    )
  }

  // Filtramos: solo se guardan keys conocidas, con valor boolean.
  const sanitized: Record<string, boolean> = {}
  for (const key of VALID_FEATURE_KEYS) {
    if (typeof body.features[key] === 'boolean') {
      sanitized[key] = body.features[key]
    }
  }

  const existing = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, plan: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  if (existing.plan !== 'custom') {
    return NextResponse.json(
      { error: "Solo se pueden asignar módulos a tenants con plan 'custom'" },
      { status: 400 }
    )
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { features: sanitized },
    select: { id: true, plan: true, features: true },
  })

  return NextResponse.json({ tenant })
}