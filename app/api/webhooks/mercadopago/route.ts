// app/api/webhooks/mercadopago/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveMaxUsers } from '@/lib/plan'

// MP manda el evento y nosotros consultamos la suscripción para obtener el estado real
async function fetchSubscription(subscriptionId: string) {
  const res = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return null
  return res.json()
}

// Mapeo de plan MP → planKey interno (Se alimenta 100% del .env cargado en producción)
function planKeyFromMpPlanId(mpPlanId: string): string | null {
  const map: Record<string, string> = {
    [process.env.MP_PLAN_STARTER  ?? '']: 'starter',
    [process.env.MP_PLAN_TEAM     ?? '']: 'team',
    [process.env.MP_PLAN_BUSINESS ?? '']: 'business',
  }
  return map[mpPlanId] ?? null
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

    const planKey = planKeyFromMpPlanId(mpPlanId)

    if (status === 'authorized') {
      // Pago aprobado con éxito o suscripción activa -> Activar Plan Premium
      if (!planKey) {
        console.warn('[webhook/mp] Mapeo de plan fallido. El ID de MP no coincide con el .env:', mpPlanId)
        return NextResponse.json({ ok: true })
      }

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: planKey,
          maxUsers: resolveMaxUsers(planKey),
          trialEndsAt: null, // Fin del período de prueba
          mpSubscriptionId: subscriptionId,
          active: true, // Cuenta totalmente operativa
        },
      })

      console.log(`[webhook/mp] ✅ Tenant ${tenantId} actualizado exitosamente al plan: ${planKey}`)

    } else if (status === 'cancelled' || status === 'paused') {
      // La suscripción se cayó, se pausó por falta de fondos o el cliente la canceló
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'free',
          maxUsers: 1,
          trialEndsAt: null,
          mpSubscriptionId: subscriptionId,
          active: true, // Mantenemos la cuenta activa para que no lo rebote el Login, pero en plan Free
        },
      })

      console.log(`[webhook/mp] ⚠️ Tenant ${tenantId} bajado a plan free debido a estado: ${status}`)
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