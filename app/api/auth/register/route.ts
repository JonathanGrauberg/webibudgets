// app/api/auth/register/route.ts
import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isValidPlan, resolveMaxUsers, resolveTrialEndsAt } from '@/lib/plan'

const MIN_PASSWORD_LENGTH = 8

const DEFAULT_BRANDING = {
  primaryColor: '#0F172A',
  secondaryColor: '#334155',
  accentColor: '#F59E0B',
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (!existing) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const { companyName, email, password, plan: rawPlan } = body ?? {}

    // Validaciones básicas
    if (!companyName || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
    }

    const plan = isValidPlan(rawPlan) && rawPlan !== 'free' ? rawPlan : 'free'
    const slug = await uniqueSlug(generateSlug(companyName))
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear tenant + usuario owner en una transacción
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          plan: 'free', // siempre arranca en free trial
          maxUsers: resolveMaxUsers('free'),
          trialEndsAt: resolveTrialEndsAt('free'),
          active: true,
          ...DEFAULT_BRANDING,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          trialEndsAt: true,
        },
      })

      const user = await tx.user.create({
        data: {
          name: companyName,
          email,
          password: hashedPassword,
          role: 'owner',
          tenantId: tenant.id,
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          tenantId: true,
          role: true,
        },
      })

      return { tenant, user }
    })

    return NextResponse.json({
      ok: true,
      tenantId: tenant.id,
      plan,           // el plan que eligió (para redirigir a MP si es pago)
      trialEndsAt: tenant.trialEndsAt,
    })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}