//lib\mercadopago-checkout.ts
//
// Cobro online por presupuesto, usando la cuenta de MP que CADA TENANT
// conectó vía OAuth (ver app/api/mercadopago/connect/*). Nada de esto usa
// MP_ACCESS_TOKEN (esa es la cuenta de Webi Studio, para cobrar las
// suscripciones PRO) — acá siempre operamos con la llave del tenant.
import { prisma } from '@/lib/prisma'
import { isProPlan } from '@/lib/features'

// 👇 Solo los tenants FREE pagan comisión — es el gancho para pasarse a PRO.
export const FREE_PLAN_COMMISSION_RATE = 0.02

// Preferencia válida por poco tiempo: si el presupuesto se edita después,
// el link viejo queda vencido solo, sin que tengamos que invalidarlo a mano.
const PREFERENCE_VALID_DAYS = 3

export type TenantMp = {
  id: string
  name: string | null
  plan: string | null
  mpConnected: boolean
  mpAccessToken: string | null
  mpRefreshToken: string | null
  mpTokenExpiresAt: Date | null
}

export class MercadoPagoNotConnectedError extends Error {
  constructor() {
    super('Este negocio todavía no conectó su cuenta de Mercado Pago')
    this.name = 'MercadoPagoNotConnectedError'
  }
}

// Refresca el access_token si ya venció (o está por vencer), y persiste el
// nuevo par de tokens. Devuelve siempre un access_token utilizable.
export async function getValidTenantMpAccessToken(tenant: TenantMp): Promise<string> {
  if (!tenant.mpConnected || !tenant.mpAccessToken) {
    throw new MercadoPagoNotConnectedError()
  }

  const expiresSoon =
    !tenant.mpTokenExpiresAt || tenant.mpTokenExpiresAt.getTime() < Date.now() + 60_000

  if (!expiresSoon) {
    return tenant.mpAccessToken
  }

  if (!tenant.mpRefreshToken) {
    // No hay refresh token guardado (no debería pasar si se conectó con
    // "offline access", pero por las dudas devolvemos el que hay).
    return tenant.mpAccessToken
  }

  const clientId = process.env.MP_CLIENT_ID
  const clientSecret = process.env.MP_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Mercado Pago no está configurado en el servidor')
  }

  const res = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: tenant.mpRefreshToken,
    }),
  })

  if (!res.ok) {
    console.error('[mercadopago-checkout] refresh de token falló', await res.text().catch(() => ''))
    // El access_token viejo puede seguir sirviendo unos minutos más — lo
    // devolvemos igual en vez de cortar el cobro de una.
    return tenant.mpAccessToken
  }

  const data = await res.json()
  const expiresAt = typeof data.expires_in === 'number' ? new Date(Date.now() + data.expires_in * 1000) : null

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      mpAccessToken: data.access_token ?? tenant.mpAccessToken,
      mpRefreshToken: data.refresh_token ?? tenant.mpRefreshToken,
      mpTokenExpiresAt: expiresAt,
    },
  })

  return data.access_token ?? tenant.mpAccessToken
}

type BudgetForPreference = {
  id: string
  budgetNumber: number | null
  total: number
  currency: string
  client: { name: string; company: string | null } | null
}

export async function createBudgetPaymentPreference(params: {
  tenant: TenantMp
  budget: BudgetForPreference
  amount: number
  publicToken: string
  origin: string
}) {
  const { tenant, budget, amount, publicToken, origin } = params

  const accessToken = await getValidTenantMpAccessToken(tenant)

  const portalUrl = `${origin}/p/${publicToken}`
  const now = new Date()
  const expiresTo = new Date(now.getTime() + PREFERENCE_VALID_DAYS * 24 * 60 * 60 * 1000)

  const clientLabel = budget.client?.company || budget.client?.name || 'Cliente'
  const isFree = !isProPlan(tenant.plan)
  const commissionAmount = isFree ? Math.round(amount * FREE_PLAN_COMMISSION_RATE * 100) / 100 : 0

  const body: Record<string, unknown> = {
    items: [
      {
        title: `Presupuesto #${budget.budgetNumber ?? budget.id.slice(0, 8)} — ${clientLabel}`,
        quantity: 1,
        unit_price: amount,
        currency_id: budget.currency || 'ARS',
      },
    ],
    external_reference: `budget:${budget.id}`,
    back_urls: {
      success: `${portalUrl}?pago=exito`,
      pending: `${portalUrl}?pago=pendiente`,
      failure: `${portalUrl}?pago=fallo`,
    },
    auto_return: 'approved',
    notification_url: `${origin}/api/webhooks/mercadopago`,
    expiration_date_from: now.toISOString(),
    expiration_date_to: expiresTo.toISOString(),
    expires: true,
  }

  if (commissionAmount > 0) {
    body.marketplace_fee = commissionAmount
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[mercadopago-checkout] creación de preferencia falló', res.status, errBody)
    throw new Error('No pudimos generar el link de cobro en Mercado Pago')
  }

  const data = await res.json()
  return {
    preferenceId: data.id as string,
    initPoint: (data.init_point ?? data.sandbox_init_point) as string,
  }
}

type CobroForPreference = {
  id: string
  cobroNumber: number
  concept: string
  amount: number
  currency: string
  client: { name: string; company: string | null } | null
}

// Mismo mecanismo que createBudgetPaymentPreference, pero para un Cobro
// (cargo recurrente sin presupuesto) — external_reference distinto
// ('cobro:' en vez de 'budget:') para que el webhook sepa a qué tabla ir.
export async function createCobroPaymentPreference(params: {
  tenant: TenantMp
  cobro: CobroForPreference
  publicToken: string
  origin: string
}) {
  const { tenant, cobro, publicToken, origin } = params

  const accessToken = await getValidTenantMpAccessToken(tenant)

  const portalUrl = `${origin}/c/${publicToken}`
  const now = new Date()
  const expiresTo = new Date(now.getTime() + PREFERENCE_VALID_DAYS * 24 * 60 * 60 * 1000)

  const clientLabel = cobro.client?.company || cobro.client?.name || 'Cliente'
  const isFree = !isProPlan(tenant.plan)
  const commissionAmount = isFree ? Math.round(cobro.amount * FREE_PLAN_COMMISSION_RATE * 100) / 100 : 0

  const body: Record<string, unknown> = {
    items: [
      {
        title: `${cobro.concept} — ${clientLabel}`.slice(0, 250),
        quantity: 1,
        unit_price: cobro.amount,
        currency_id: cobro.currency || 'ARS',
      },
    ],
    external_reference: `cobro:${cobro.id}`,
    back_urls: {
      success: `${portalUrl}?pago=exito`,
      pending: `${portalUrl}?pago=pendiente`,
      failure: `${portalUrl}?pago=fallo`,
    },
    auto_return: 'approved',
    notification_url: `${origin}/api/webhooks/mercadopago`,
    expiration_date_from: now.toISOString(),
    expiration_date_to: expiresTo.toISOString(),
    expires: true,
  }

  if (commissionAmount > 0) {
    body.marketplace_fee = commissionAmount
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[mercadopago-checkout] creación de preferencia de cobro falló', res.status, errBody)
    throw new Error('No pudimos generar el link de cobro en Mercado Pago')
  }

  const data = await res.json()
  return {
    preferenceId: data.id as string,
    initPoint: (data.init_point ?? data.sandbox_init_point) as string,
    commissionAmount,
  }
}
