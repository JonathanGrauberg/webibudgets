//app\api\auth\register\route.ts
import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resolveMaxUsers, resolveTrialEndsAt } from '@/lib/plan'
import { issueAndSendVerificationEmail } from '@/lib/email-verification'

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

    // 🔒 NORMALIZACIÓN TOTAL DEL EMAIL EN BACKEND (Anti-Mayúsculas)
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

    const validPublicPlans = ['free'] as const
    type PublicPlan = typeof validPublicPlans[number]
    const plan: PublicPlan = validPublicPlans.includes(rawPlan as PublicPlan)
      ? (rawPlan as PublicPlan)
      : 'free'

    const slug = await uniqueSlug(generateSlug(companyName))
    const hashedPassword = await bcrypt.hash(password, 10)

    // 👇 metadata de alta — de dónde vino este tenant, para soporte/seguridad.
    // x-vercel-ip-country lo agrega automáticamente el borde de Vercel, sin
    // pedirle nada a nadie ni depender de un servicio externo de geo-IP.
    const signupCountry = req.headers.get('x-vercel-ip-country') || null
    const signupReferrer = req.headers.get('referer') || null
    const signupUserAgent = req.headers.get('user-agent') || null

    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          plan,
          maxUsers: resolveMaxUsers(plan),
          trialEndsAt: resolveTrialEndsAt(plan),
          active: true,
          signupCountry,
          signupReferrer,
          signupUserAgent,
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
          email, // Se guarda impecable en minúsculas
          password: hashedPassword,
          role: 'admin',
          tenantId: tenant.id,
          active: true,
          lastLoginAt: new Date(),
        },
        select: { id: true },
      })

      return { tenant, user }
    })

    // 👇 nuevo — verificación de email. No bloquea el alta: si Resend falla
    // por lo que sea, la cuenta ya quedó creada igual (issueAndSendVerificationEmail
    // nunca tira). El usuario puede loguearse ya mismo; lo único que queda
    // atado a verificar es crear presupuestos y pasar a PRO.
    await issueAndSendVerificationEmail(user.id, email, process.env.NEXTAUTH_URL || req.nextUrl.origin)

    return NextResponse.json({
      ok: true,
      tenantId: tenant.id,
      plan,
      trialEndsAt: tenant.trialEndsAt,
    })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}