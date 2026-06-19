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

    // 🌐 Detectar dinámicamente el dominio (Sirve tanto para localhost como para budgets.webistudio.net)
    const origin = req.nextUrl.origin

    // 🔗 Definimos las URLs de retorno para el usuario
    const successUrl = `${origin}/dashboard?subscription=success`
    const pendingUrl = `${origin}/dashboard?subscription=pending`

    // Construimos la URL oficial de Mercado Pago para suscripciones de forma directa.
    const baseUrl = 'https://www.mercadopago.com.ar/subscriptions/checkout'
    
    const checkoutUrl = new URL(baseUrl)
    checkoutUrl.searchParams.append('preapproval_plan_id', config.mpPlanId)
    checkoutUrl.searchParams.append('external_reference', tenantId) // Clave crucial para tu Webhook
    
    // 🇦🇷 AGREGAMOS LAS REGLAS DE RETORNO A MERCADOPAGO
    // MercadoPago usa 'back_url' de forma global en sus checkouts directos
    checkoutUrl.searchParams.append('back_url', pendingUrl) 
    
    // Si tu plan de MercadoPago soporta parámetros avanzados, le inyectamos success explícito
    checkoutUrl.searchParams.append('success_url', successUrl)
    checkoutUrl.searchParams.append('failure_url', pendingUrl)

    if (token?.email) {
      checkoutUrl.searchParams.append('payer_email', token.email)
    }

    console.log('[checkout] Generada URL Directa de MP con BackURLs:', checkoutUrl.toString())

    // Devolvemos la URL al frontend exactamente igual que antes
    return NextResponse.json({
      checkoutUrl: checkoutUrl.toString(),
      subscriptionId: `DIRECT-${config.mpPlanId}`, // ID temporal referencial
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}