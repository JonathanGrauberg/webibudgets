// app/api/webhooks/mercadopago/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getValidTenantMpAccessToken, FREE_PLAN_COMMISSION_RATE } from '@/lib/mercadopago-checkout'
import { isProPlan } from '@/lib/features'

// MP manda el evento y nosotros consultamos la suscripción para obtener el estado real
async function fetchSubscription(subscriptionId: string) {
  const res = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return null
  return res.json()
}

// Mapeo de plan MP → planKey interno (Se alimenta 100% del .env cargado en producción)
function resolveBillingInterval(mpPlanId: string): 'monthly' | 'annual' | null {
  if (mpPlanId === process.env.MP_PLAN_PRO_MONTHLY) return 'monthly'
  if (mpPlanId === process.env.MP_PLAN_PRO_ANNUAL) return 'annual'
  return null
}

// 👇 nuevo — cobro de un presupuesto (distinto de una suscripción PRO). El
// webhook de "payment" trae el user_id del VENDEDOR (el tenant conectado),
// así que buscamos el tenant por ese id en vez de por external_reference —
// es el dato más confiable que nos manda MP sin tener que adivinar nada.
async function handlePaymentWebhook(paymentId: string, collectorUserId: string | undefined) {
  if (!collectorUserId) {
    console.warn('[webhook/mp] Notificación de pago sin user_id, no podemos identificar el tenant')
    return
  }

  const tenant = await prisma.tenant.findFirst({ where: { mpUserId: String(collectorUserId) } })
  if (!tenant) {
    console.warn('[webhook/mp] Ningún tenant conectado con mpUserId:', collectorUserId)
    return
  }

  if (!tenant.mpConnected || !tenant.mpAccessToken) {
    console.warn('[webhook/mp] Tenant encontrado pero sin cuenta de MP conectada:', tenant.id)
    return
  }

  const accessToken = await getValidTenantMpAccessToken(tenant)

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!paymentRes.ok) {
    console.error('[webhook/mp] No pudimos traer el pago desde la API de MP:', paymentId, paymentRes.status)
    return
  }

  const payment = await paymentRes.json()
  const externalReference = payment.external_reference as string | undefined
  const budgetId = externalReference?.startsWith('budget:') ? externalReference.slice('budget:'.length) : null

  if (!budgetId) {
    console.warn('[webhook/mp] Pago sin external_reference de presupuesto reconocible:', paymentId)
    return
  }

  const budget = await prisma.budget.findFirst({ where: { id: budgetId, tenantId: tenant.id } })
  if (!budget) {
    console.warn('[webhook/mp] El presupuesto del pago no existe (o no es de ese tenant):', budgetId)
    return
  }

  // MP tiene más estados (in_process, authorized, in_mediation, etc.) — los
  // reducimos a los 3 que de verdad importan para el cobro.
  const status: 'approved' | 'pending' | 'rejected' =
    payment.status === 'approved' ? 'approved' : payment.status === 'rejected' || payment.status === 'cancelled' ? 'rejected' : 'pending'

  const amount = Number(payment.transaction_amount) || 0
  const commissionAmount = !isProPlan(tenant.plan)
    ? Math.round(amount * FREE_PLAN_COMMISSION_RATE * 100) / 100
    : 0

  await prisma.budgetPayment.upsert({
    where: { mpPaymentId: String(payment.id) },
    update: { status, amount, commissionAmount },
    create: {
      budgetId: budget.id,
      tenantId: tenant.id,
      mpPaymentId: String(payment.id),
      mpPreferenceId: payment.preference_id ?? null,
      amount,
      commissionAmount,
      status,
    },
  })

  console.log(`[webhook/mp] 💰 Pago ${payment.id} (${status}) registrado para presupuesto ${budget.id}`)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    // MP manda distintos tipos de notificación (Preapproval es para suscripciones)
    const type = body?.type ?? body?.action
    const resourceId = body?.data?.id ?? body?.id

    console.log('[webhook/mp] Recibido evento tipo:', type, 'ID:', resourceId)

    if (!resourceId) {
      return NextResponse.json({ ok: true }) // Evita procesar pings vacíos de validación
    }

    // 👇 Cobro de un presupuesto — flujo totalmente distinto al de abajo
    if (type === 'payment') {
      await handlePaymentWebhook(String(resourceId), body?.user_id ? String(body.user_id) : undefined)
      return NextResponse.json({ ok: true })
    }

    // Traer la suscripción en tiempo real desde MP
    const subscription = await fetchSubscription(resourceId)
    if (!subscription) {
      console.warn('[webhook/mp] Suscripción no encontrada en MP API:', resourceId)
      return NextResponse.json({ ok: true })
    }

    const {
      status, // authorized | pending | paused | cancelled
      external_reference: tenantId,
      preapproval_plan_id: mpPlanId,
      id: subscriptionId,
    } = subscription

    if (!tenantId) {
      console.warn('[webhook/mp] El evento no contiene external_reference (tenantId). Ignorando.')
      return NextResponse.json({ ok: true })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      console.warn('[webhook/mp] Tenant especificado no existe en la DB:', tenantId)
      return NextResponse.json({ ok: true })
    }

    if (status === 'authorized') {
    const interval = resolveBillingInterval(mpPlanId)
    if (!interval) {
      console.warn('[webhook/mp] El ID de plan de MP no coincide con ningún plan PRO conocido:', mpPlanId)
      return NextResponse.json({ ok: true })
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: 'custom', // 👈 PRO = plan 'custom' en tu sistema de features
        proBillingInterval: interval,
        trialEndsAt: null,
        mpSubscriptionId: subscriptionId,
        active: true,
      },
    })

    console.log(`[webhook/mp] ✅ Tenant ${tenantId} activado a PRO (${interval})`)

  } else if (status === 'cancelled' || status === 'paused') {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: 'free',
        proBillingInterval: null,
        trialEndsAt: null,
        mpSubscriptionId: subscriptionId,
        active: true,
      },
    })

    console.log(`[webhook/mp] ⚠️ Tenant ${tenantId} bajado a Free debido a estado: ${status}`)
  }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/mp] Error crítico en procesamiento:', err)
    return NextResponse.json({ ok: true }) // Siempre 200 para mitigar loops de reintentos fallidos de MP
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'WebiBudgets MP Webhook Activo' })
}