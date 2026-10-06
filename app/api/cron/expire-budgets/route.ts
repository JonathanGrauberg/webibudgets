// app/api/cron/expire-budgets/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { expireOverdueBudgets } from '@/lib/budget-expiry'

// Lo llama Vercel Cron (ver vercel.json): pasa a "Vencido" los presupuestos
// cuya fecha de "válido hasta" ya pasó, para todos los tenants.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expired = await expireOverdueBudgets()
  console.log(`[cron/expire-budgets] Presupuestos vencidos: ${expired}`)
  return NextResponse.json({ ok: true, expired })
}
