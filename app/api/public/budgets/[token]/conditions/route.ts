//app\api\public\budgets\[token]\conditions\route.ts
//
// Sin login — sirve el PDF de condiciones/anexos del negocio para el portal
// público del presupuesto. Solo si el presupuesto tiene activado "adjuntar
// condiciones" y el negocio tiene el PDF cargado.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const budget = await prisma.budget.findUnique({
    where: { publicToken: token },
    select: {
      active: true,
      attachConditionsPdf: true,
      tenant: { select: { conditionsPdfUrl: true, conditionsPdfName: true } },
    },
  })

  const dataUri = budget?.tenant?.conditionsPdfUrl
  if (!budget || !budget.active || !budget.attachConditionsPdf || !dataUri) {
    return NextResponse.json({ error: 'No hay condiciones adjuntas' }, { status: 404 })
  }

  const base64 = dataUri.split(',')[1]
  if (!base64) {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 404 })
  }

  const fileName = (budget.tenant?.conditionsPdfName || 'condiciones.pdf').replace(/[^\w.\- ]+/g, '_')

  return new Response(Buffer.from(base64, 'base64'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
