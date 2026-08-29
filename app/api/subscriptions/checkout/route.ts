import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getDiscountedPlanId } from '@/lib/reseller-discounts'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const interval = body?.interval
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : null

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const tenantId = token?.tenantId as string | undefined

    if (!tenantId) {
      return NextResponse.json({ error: 'No estás logueado' }, { status: 401 })
    }
    if (interval !== 'monthly' && interval !== 'annual') {
      return NextResponse.json({ error: 'Intervalo inválido' }, { status: 400 })
    }

    // 📧 A propósito NO se chequea acá si el email está verificado —
    // decisión explícita: trabar el pago justo cuando alguien se registra
    // con intención de pagar PRO significa que nadie podría completar la
    // compra en el mismo paso del registro (no da tiempo a verificar el
    // email en el medio). El gate de verificación vive solo en la creación
    // de presupuestos (ver app/api/budgets/route.ts). Como salvaguarda
    // liviana, el registro con intención PRO muestra un aviso pidiendo
    // confirmar que el email esté bien escrito antes de pagar (ver
    // RegisterForm.tsx), ya que ahí se manda el comprobante de pago.

    let mpPlanId = interval === 'monthly'
      ? process.env.MP_PLAN_PRO_MONTHLY
      : process.env.MP_PLAN_PRO_ANNUAL

    // 🎟️ Si mandaron código, validamos y cambiamos al plan descontado
    if (code) {
      const resellerCode = await prisma.resellerCode.findFirst({
        where: { code, active: true },
      })

      if (!resellerCode) {
        return NextResponse.json({ error: 'Código inválido o vencido' }, { status: 400 })
      }

      const discountedPlanId = getDiscountedPlanId(resellerCode.discountPercent, interval)
      if (!discountedPlanId) {
        return NextResponse.json({ error: 'Ese descuento no está disponible por ahora' }, { status: 500 })
      }

      mpPlanId = discountedPlanId

      // 👇 Atribución permanente — se guarda ANTES de ir a MercadoPago, "de por vida"
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { referralCodeId: resellerCode.id },
      })
    }

    if (!mpPlanId) {
      return NextResponse.json({ error: 'Plan PRO no configurado en el servidor' }, { status: 500 })
    }

    const origin = req.nextUrl.origin
    const pendingUrl = `${origin}/dashboard?subscription=pending`
    const successUrl = `${origin}/dashboard?subscription=success`

    const checkoutUrl = new URL('https://www.mercadopago.com.ar/subscriptions/checkout')
    checkoutUrl.searchParams.append('preapproval_plan_id', mpPlanId)
    checkoutUrl.searchParams.append('external_reference', tenantId)
    checkoutUrl.searchParams.append('back_url', pendingUrl)
    checkoutUrl.searchParams.append('success_url', successUrl)
    checkoutUrl.searchParams.append('failure_url', pendingUrl)
    if (token?.email) checkoutUrl.searchParams.append('payer_email', token.email as string)

    return NextResponse.json({ checkoutUrl: checkoutUrl.toString() })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}