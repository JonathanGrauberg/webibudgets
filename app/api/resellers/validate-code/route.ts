import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  const found = await prisma.resellerCode.findFirst({
    where: { code, active: true },
    select: { id: true, discountPercent: true, resellerName: true },
  })

  if (!found) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true, discountPercent: found.discountPercent })
}