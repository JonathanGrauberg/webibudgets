//app\api\user\onboarding\route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: { hasSeenOnboarding: true },
  })

  // Si algo falla, por defecto NO forzamos el tour (fallback seguro)
  return NextResponse.json({ hasSeenOnboarding: user?.hasSeenOnboarding ?? true })
}

export async function PATCH(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.update({
    where: { id: token.id as string },
    data: { hasSeenOnboarding: true },
  })

  return NextResponse.json({ ok: true })
}