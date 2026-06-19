import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resolveMaxUsers, resolveTrialEndsAt } from '@/lib/plan'

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
    const { companyName, email: rawEmail, password, plan: rawPlan } = body ?? {}

    if (!companyName || !rawEmail || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const email = rawEmail.trim().toLowerCase()

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

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
    }

// 🌟 NORMALIZACIÓN INTELIGENTE DEL PLAN
    const validPublicPlans = ['starter', 'team', 'business'] as const
    type PublicPlan = typeof validPublicPlans[number]
    
    // Guardamos si el origen real del usuario fue el flujo gratuito
    const isFreeFlow = rawPlan === 'free' || !rawPlan

    // Para la base de datos, el plan de prueba será 'starter' (Básico) o 'team' (Negocio)
    const plan: PublicPlan = validPublicPlans.includes(rawPlan as PublicPlan)
      ? (rawPlan as PublicPlan)
      : 'starter' // Si vino 'free', le asignamos 'starter' para que tenga sus 14 días y 1 usuario

    const slug = await uniqueSlug(generateSlug(companyName))
    const hashedPassword = await bcrypt.hash(password, 10)

    const { tenant } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          plan,
          maxUsers: resolveMaxUsers(plan),
          trialEndsAt: resolveTrialEndsAt(plan), // Esto le da los 14 días perfectos de tu lib/plan.ts
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

      await tx.user.create({
        data: {
          name: companyName,
          email,
          password: hashedPassword,
          role: 'admin',
          tenantId: tenant.id,
          active: true,
        },
      })

      return { tenant }
    })

    return NextResponse.json({
      ok: true,
      tenantId: tenant.id,
      plan: plan,
      isFreeTrialUser: isFreeFlow, // 👈 Le avisamos al cliente de dónde vino
      trialEndsAt: tenant.trialEndsAt,
    })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}