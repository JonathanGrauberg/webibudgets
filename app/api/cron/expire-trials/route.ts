// app/api/cron/expire-trials/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Este endpoint lo llama Vercel Cron (configurado en vercel.json)
// También se puede llamar manualmente con el header correcto
export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron o de una llamada interna autorizada
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Buscar tenants con trial vencido que siguen activos
  const expired = await prisma.tenant.findMany({
    where: {
      active: true,
      trialEndsAt: { lt: now }, // trialEndsAt < ahora
      plan: { in: ['starter', 'team'] }, // solo planes con trial
    },
    select: { id: true, name: true, plan: true, trialEndsAt: true },
  })

  if (expired.length === 0) {
    return NextResponse.json({ ok: true, deactivated: 0, message: 'No expired trials found' })
  }

  // Desactivar todos los tenants con trial vencido
  const result = await prisma.tenant.updateMany({
    where: {
      id: { in: expired.map((t) => t.id) },
    },
    data: { active: false },
  })

  console.log(`[cron/expire-trials] Desactivados ${result.count} tenants:`, expired.map((t) => t.name))

  return NextResponse.json({
    ok: true,
    deactivated: result.count,
    tenants: expired.map((t) => ({ id: t.id, name: t.name, plan: t.plan, trialEndsAt: t.trialEndsAt })),
  })
}