//app\api\tenants\users\route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { ensureInstallerForUser, ensureSellerForUser } from '@/lib/user-profile-sync'

const TENANT_HEADER = 'x-tenant-id'
const MIN_PASSWORD_LENGTH = 8

function generateTempPassword() {
  return Math.random().toString(36).slice(-12) + 'Aa1!'
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const h = await headers()
  const tenantId = h.get(TENANT_HEADER)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 })
  }

  try {
    
    const [users, tenant] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, maxUsers: true, trialEndsAt: true }, // <-- agregar trialEndsAt
      }),
    ])
 
    const maxUsers = tenant?.maxUsers ?? 1
    const activeUsers = users.filter((u) => u.active).length
 
    return NextResponse.json({
      users,
      plan: tenant?.plan ?? 'starter',
      maxUsers,
      activeUsers,
      trialEndsAt: tenant?.trialEndsAt ? tenant.trialEndsAt.toISOString() : null, // <-- nuevo
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const h = await headers()
  const tenantId = h.get(TENANT_HEADER)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 })
  }

  

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
  })

  if (!user || !['owner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, email, role = 'viewer', password } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      )
    }

    // ✅ Verificar límite de plan antes de crear
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true },
    })
    const maxUsers = tenant?.maxUsers ?? 5
    const activeCount = await prisma.user.count({
      where: { tenantId, active: true },
    })
    if (activeCount >= maxUsers) {
      return NextResponse.json({ error: 'plan_limit_reached' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          tenantId,
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      })

      const profileInput = {
        userId: created.id,
        tenantId,
        fullName: name,
        email,
        active: true,
      }

      if (role === 'seller') {
        await ensureSellerForUser(tx, profileInput)
      }

      if (role === 'installer') {
        await ensureInstallerForUser(tx, profileInput)
      }

      

      return created
    })


    

    return NextResponse.json({
      user: newUser,
      message: 'User created successfully.',
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// ── EXPRESIÓN REGULAR DE SEGURIDAD ─────────────────────────────────────────────
// Mínimo 8 caracteres, al menos 1 Mayúscula, 1 Minúscula, 1 Número y 1 Símbolo especial.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&!#$])[A-Za-z\d@$!%*?&!#$]{8,}$/

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const h = await headers()
  const tenantId = h.get(TENANT_HEADER)
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
  })

  if (!user || !['owner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    // 🌟 Recibimos 'newPassword' en lugar de un booleano ciego
    const { userId, role, active, newPassword } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser || targetUser.tenantId !== tenantId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (active === true && targetUser.active === false) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxUsers: true },
      })
      const maxUsers = tenant?.maxUsers ?? 5
      const activeCount = await prisma.user.count({
        where: { tenantId, active: true },
      })
      if (activeCount >= maxUsers) {
        return NextResponse.json({ error: 'plan_limit_reached' }, { status: 403 })
      }
    }

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (active !== undefined) updateData.active = active

    // 🌟 VALIDACIÓN DE LA CONTRASEÑA EN EL BACKEND
    if (newPassword !== undefined && newPassword !== null && newPassword !== '') {
  if (typeof newPassword !== 'string' || !PASSWORD_REGEX.test(newPassword)) {
    return NextResponse.json({ 
      error: 'La contraseña no cumple con los requisitos mínimos de seguridad...' 
    }, { status: 400 })
  }
  
  // 🔥 Forzamos la generación de la sal explícita con bcryptjs para blindar la compatibilidad
  const salt = await bcrypt.genSalt(10)
  updateData.password = await bcrypt.hash(newPassword, salt)
}

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      user: updated,
      message: newPassword ? 'Contraseña actualizada con éxito.' : 'Usuario modificado.',
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}