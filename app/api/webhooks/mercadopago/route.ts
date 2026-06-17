// app/api/webhooks/mercadopago/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPlanConfig, isValidPlan, resolveMaxUsers } from '@/lib/plan'

// MP manda el evento y nosotros consultamos la suscripción para obtener el estado real
async function fetchSubscription(subscriptionId: string) {
  const res = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })
  if (!res.ok) return null
  return res.json()
}

// Mapeo de plan MP → planKey interno
// El reason del plan de MP contiene "Básico", "Negocio", "Empresarial"
function planKeyFromMpPlanId(mpPlanId: string): string | null {
  const map: Record<string, string> = {
    [process.env.MP_PLAN_STARTER ?? '013e97360fdb4a8c87c8a72ba9f15636']: 'starter',
    [process.env.MP_PLAN_TEAM    ?? '00d8a5d4167646d780267ccb99fe23a1']: 'team',
    [process.env.MP_PLAN_BUSINESS ?? '800f4b8345774aa58000b9959018c19f']: 'business',
  }
  return map[mpPlanId] ?? null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    // MP manda distintos tipos de notificación
    // El que nos importa es "subscription_preapproval"
    const type = body?.type ?? body?.action
    const resourceId = body?.data?.id ?? body?.id

    console.log('[webhook/mp] type:', type, 'id:', resourceId)

    if (!resourceId) {
      return NextResponse.json({ ok: true }) // MP a veces manda pings vacíos
    }

    // Traer la suscripción real desde MP
    const subscription = await fetchSubscription(resourceId)
    if (!subscription) {
      console.warn('[webhook/mp] suscripción no encontrada:', resourceId)
      return NextResponse.json({ ok: true })
    }

    const {
      status,           // authorized | pending | paused | cancelled
      external_reference: tenantId,
      preapproval_plan_id: mpPlanId,
      id: subscriptionId,
    } = subscription

    if (!tenantId) {
      console.warn('[webhook/mp] sin external_reference, ignorando')
      return NextResponse.json({ ok: true })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      console.warn('[webhook/mp] tenant no encontrado:', tenantId)
      return NextResponse.json({ ok: true })
    }

    const planKey = planKeyFromMpPlanId(mpPlanId)

    if (status === 'authorized') {
      // Pago aprobado → activar plan
      if (!planKey) {
        console.warn('[webhook/mp] plan desconocido para mpPlanId:', mpPlanId)
        return NextResponse.json({ ok: true })
      }

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: planKey,
          maxUsers: resolveMaxUsers(planKey),
          trialEndsAt: null,       // ya no está en trial
          mpSubscriptionId: subscriptionId,
          active: true,
        },
      })

      console.log(`[webhook/mp] tenant ${tenantId} actualizado a plan ${planKey}`)

    } else if (status === 'cancelled' || status === 'paused') {
      // Suscripción cancelada → volver a free (sin trial)
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'free',
          maxUsers: 1,
          trialEndsAt: null,       // trial ya no aplica si canceló
          mpSubscriptionId: subscriptionId,
          active: status !== 'cancelled', // si canceló, desactivar
        },
      })

      console.log(`[webhook/mp] tenant ${tenantId} suscripción ${status}`)
    }

    // Siempre devolver 200 a MP para que no reintente
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/mp]', err)
    // Igual devolvemos 200 para que MP no haga retry infinito
    return NextResponse.json({ ok: true })
  }
}

// MP también manda GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true, service: 'WebiBudgets MP Webhook' })
}