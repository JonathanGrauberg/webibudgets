import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isOwnerRole } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

async function requireOwner(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !isOwnerRole(token.role as string | undefined)) return null
  return token
}

export async function POST(req: NextRequest) {
  const token = await requireOwner(req)
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const code = String(body.code ?? '').trim().toUpperCase()
    const resellerName = String(body.resellerName ?? '').trim()
    const resellerContact = body.resellerContact ? String(body.resellerContact).trim() : null
    const discountPercent = Number(body.discountPercent)

    if (!code || !resellerName || !discountPercent) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const existing = await prisma.resellerCode.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Ese código ya existe' }, { status: 409 })
    }

    const created = await prisma.resellerCode.create({
      data: { code, resellerName, resellerContact, discountPercent, active: true },
      include: { tenants: { select: { id: true, name: true, plan: true, proBillingInterval: true } } },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating reseller code:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}