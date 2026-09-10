//app\api\mercadopago\connect\route.ts
//
// Paso 1 del flujo OAuth "Conectar con Mercado Pago": redirige al tenant a
// autorizar nuestra app en SU cuenta de MP. El state (tenantId + nonce) va
// firmado en una cookie httpOnly de corta duración para validarlo en el
// callback y evitar que alguien fuerce la conexión de una cuenta ajena.
import { NextResponse, NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { getToken } from 'next-auth/jwt'

const MANAGER_ROLES = ['owner', 'admin']
const STATE_COOKIE = 'mp_connect_state'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined

  if (!tenantId || !role || !MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const clientId = process.env.MP_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Mercado Pago no está configurado en el servidor' }, { status: 500 })
  }

  const nonce = randomBytes(16).toString('hex')
  const state = `${tenantId}.${nonce}`

  const redirectUri = `${req.nextUrl.origin}/api/mercadopago/connect/callback`
  const authUrl = new URL('https://auth.mercadopago.com.ar/authorization')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('platform_id', 'mp')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  const res = NextResponse.redirect(authUrl)
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })
  return res
}
