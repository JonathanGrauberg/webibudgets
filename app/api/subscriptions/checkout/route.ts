// app/api/subscriptions/checkout/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPlanConfig, isValidPlan } from '@/lib/plan'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const { plan, tenantId: bodyTenantId } = body ?? {}

    // Puede venir autenticado (desde settings) o sin token (justo después del registro)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const tenantId = (token?.tenantId as string | undefined) ?? bodyTenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no identificado' }, { status: 400 })
    }

    if (!isValidPlan(plan) || plan === 'free') {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const config = getPlanConfig(plan)
    if (!config.mpPlanId) {
      return NextResponse.json({ error: 'Plan sin ID de MercadoPago configurado' }, { status: 400 })
    }

    // Crear preferencia de suscripción en MP
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preapproval_plan_id: config.mpPlanId,
        back_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
        external_reference: tenantId, // ← clave: así el webhook sabe qué tenant actualizar
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: config.priceARS,
          currency_id: 'ARS',
        },
      }),
    })

    if (!mpResponse.ok) {
      const mpError = await mpResponse.json().catch(() => ({}))
      console.error('[checkout] MP error:', mpError)
      return NextResponse.json({ error: 'Error al crear la suscripción en MercadoPago' }, { status: 500 })
    }

    const mpData = await mpResponse.json()

    return NextResponse.json({
      checkoutUrl: mpData.init_point,
      subscriptionId: mpData.id,
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}