//app\api\mercadopago\connect\callback\route.ts
//
// Paso 2: Mercado Pago vuelve acá con un "code" tras la autorización del
// tenant. Lo canjeamos por access_token/refresh_token de SU cuenta y los
// guardamos en Tenant. Nunca exponemos esos tokens al cliente.
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATE_COOKIE = 'mp_connect_state'

function settingsRedirect(req: NextRequest, status: 'connected' | 'error') {
  const url = new URL('/settings/company', req.nextUrl.origin)
  url.searchParams.set('tab', 'plan')
  url.searchParams.set('mp', status)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const expectedState = req.cookies.get(STATE_COOKIE)?.value

  if (!code || !state || !expectedState || state !== expectedState) {
    return settingsRedirect(req, 'error')
  }

  const [tenantId] = state.split('.')
  if (!tenantId) {
    return settingsRedirect(req, 'error')
  }

  const clientId = process.env.MP_CLIENT_ID
  const clientSecret = process.env.MP_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return settingsRedirect(req, 'error')
  }

  const redirectUri = `${req.nextUrl.origin}/api/mercadopago/connect/callback`

  try {
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text().catch(() => '')
      console.error('[mercadopago/connect/callback] token exchange failed', tokenRes.status, errBody)
      return settingsRedirect(req, 'error')
    }

    const data = await tokenRes.json()
    const expiresAt = typeof data.expires_in === 'number'
      ? new Date(Date.now() + data.expires_in * 1000)
      : null

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        mpConnected: true,
        mpUserId: data.user_id ? String(data.user_id) : null,
        mpAccessToken: data.access_token ?? null,
        mpRefreshToken: data.refresh_token ?? null,
        mpTokenExpiresAt: expiresAt,
        mpPublicKey: data.public_key ?? null,
      },
    })

    const res = settingsRedirect(req, 'connected')
    res.cookies.delete(STATE_COOKIE)
    return res
  } catch (err) {
    console.error('[mercadopago/connect/callback]', err)
    return settingsRedirect(req, 'error')
  }
}
