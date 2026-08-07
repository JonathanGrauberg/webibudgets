import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isOwnerRole } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !isOwnerRole(token.role as string | undefined)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.resellerCode.update({
      where: { id },
      data: { active: !!body.active },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating reseller code:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}