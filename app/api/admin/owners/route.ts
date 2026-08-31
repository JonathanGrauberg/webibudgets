// app/api/admin/owners/route.ts
//
// Gestión de cuentas "owner del sistema" (isSystemOwner) — acceso total,
// nunca bloqueado por plan/trial/estado del tenant. A propósito NO
// alcanza con role === 'owner': solo alguien que YA es system owner
// puede crear otro. Así nadie externo llega nunca a esta ruta, ni
// siquiera un owner de tenant común (que hoy no existen, pero por las
// dudas).

import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const MIN_PASSWORD_LENGTH = 8

async function requireSystemOwner(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.isSystemOwner) return null
  return token
}

export async function GET(req: NextRequest) {
  const token = await requireSystemOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owners = await prisma.user.findMany({
    where: { isSystemOwner: true },
    select: { id: true, name: true, email: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ owners })
}

export async function POST(req: NextRequest) {
  const token = await requireSystemOwner(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { name, email: rawEmail, password } = body ?? {}

  if (!name || !rawEmail || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  const email = String(rawEmail).trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
  }

  // El nuevo owner cuelga del mismo tenant que quien lo crea — no importa
  // cuál sea: isSystemOwner ignora el estado/plan del tenant en todos lados.
  const creator = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: { tenantId: true },
  })
  if (!creator) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const hashedPassword = await bcrypt.hash(password, 10)

  const owner = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'owner',
      isSystemOwner: true,
      tenantId: creator.tenantId,
      active: true,
      emailVerified: new Date(), // lo dio de alta otro owner ya autenticado — no hace falta re-verificar
    },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json({ owner })
}
