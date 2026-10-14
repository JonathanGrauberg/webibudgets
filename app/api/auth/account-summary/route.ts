// app/api/auth/account-summary/route.ts
//
// Datos mínimos de la sesión actual para la pantalla de login ("Continuar como
// <negocio>"): nombre y logo del negocio, y el email del usuario. Si no hay
// sesión, devuelve tenantName null (200, para no ensuciar la consola).
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  if (!token || !tenantId) {
    return NextResponse.json({ tenantName: null })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, logoUrl: true },
  })

  return NextResponse.json({
    tenantName: tenant?.name ?? null,
    logoUrl: tenant?.logoUrl ?? null,
    email: (token.email as string | undefined) ?? null,
    role: (token.role as string | undefined) ?? null,
  })
}
