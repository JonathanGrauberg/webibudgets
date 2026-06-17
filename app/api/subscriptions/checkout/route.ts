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

    // El objeto mínimo y necesario para que genere la redirección correcta
    const requestBody = {
      preapproval_plan_id: config.mpPlanId,
      back_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      external_reference: tenantId, // El puente clave hacia tu Webhook
      payer_email: token?.email ?? undefined // Opcional: si lo tenés a mano le pre-rellena el email al cliente en MP
    }

    console.log('[checkout] Enviando a MP:', requestBody)

    // Crear preferencia de suscripción en MP vinculada al Plan Maestro
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const mpData = await mpResponse.json().catch(() => ({}))

    if (!mpResponse.ok) {
      console.error('[checkout] MP error:', mpData)
      return NextResponse.json({ error: 'Error al crear la suscripción en MercadoPago' }, { status: 500 })
    }

    return NextResponse.json({
      checkoutUrl: mpData.init_point, // Redirigí a tu frontend a este link
      subscriptionId: mpData.id,
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}