// app/api/calendar-events/clear/route.ts
//
// "Vaciar calendario completo" — borra TODAS las anotaciones del tenant,
// sin importar quién las creó. Es la excepción deliberada a "cada uno
// borra solo lo suyo": un escape para reiniciar de cero, restringido a
// Owner/Admin porque es un borrado masivo e irreversible.
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const MANAGER_ROLES = ['owner', 'admin']

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined
  if (!tenantId || !role || !MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Solo un administrador puede vaciar el calendario' }, { status: 403 })
  }

  const result = await prisma.calendarEvent.deleteMany({ where: { tenantId } })
  return NextResponse.json({ ok: true, deleted: result.count })
}
