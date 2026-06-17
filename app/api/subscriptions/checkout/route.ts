// app/api/subscriptions/checkout/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getPlanConfig, isValidPlan } from '@/lib/plan'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const { plan, tenantId: bodyTenantId } = body ?? {}

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

    // Construimos la URL oficial de Mercado Pago para suscripciones de forma directa.
    // Le pasamos por Query Parameters el external_reference y el email para que MP los capture.
    const baseUrl = 'https://www.mercadopago.com.ar/subscriptions/checkout'
    
    const checkoutUrl = new URL(baseUrl)
    checkoutUrl.searchParams.append('preapproval_plan_id', config.mpPlanId)
    checkoutUrl.searchParams.append('external_reference', tenantId) // Clave para tu Webhook
    
    if (token?.email) {
      checkoutUrl.searchParams.append('payer_email', token.email)
    }

    console.log('[checkout] Generada URL Directa de MP exitosamente:', checkoutUrl.toString())

    // Devolvemos la URL al frontend exactamente igual que antes para que no rompa nada
    return NextResponse.json({
      checkoutUrl: checkoutUrl.toString(),
      subscriptionId: `DIRECT-${config.mpPlanId}`, // ID temporal referencial
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}