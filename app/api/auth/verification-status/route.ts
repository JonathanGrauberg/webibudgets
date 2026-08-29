// app/api/auth/verification-status/route.ts
//
// El cartel de "verificá tu email" lee este endpoint en vez de confiar en
// el JWT de sesión — el JWT no se refresca hasta el próximo login, así
// que si confiáramos en un campo tipo `token.emailVerified`, alguien que
// verifica su email en otra pestaña seguiría viendo el cartel hasta
// desloguearse. Esto siempre pega contra la base, así que refleja el
// estado real al instante.

import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: 'No estás logueado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    email: user.email,
    emailVerified: !!user.emailVerified,
  })
}
