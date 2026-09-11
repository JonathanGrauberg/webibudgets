//app\api\budgets\[id]\followups\[followupId]\route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; followupId: string }> }) {
  const tenantId = await getTenantIdFromRequest(request)
  const { id, followupId } = await params

  const existing = await prisma.budgetFollowup.findFirst({ where: { id: followupId, budgetId: id, tenantId } })
  if (!existing) {
    return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
  }

  await prisma.budgetFollowup.delete({ where: { id: followupId } })
  return NextResponse.json({ ok: true })
}
