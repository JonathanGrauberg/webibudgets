//app\api\arca\test-wsaa\route.ts
//
// Paso 3: probar la autenticación WSAA de punta a punta con el
// certificado ya subido. No emite nada — solo confirma que ARCA acepta
// nuestro certificado y nos da un Ticket de Acceso. Nunca devuelve el
// token/sign real al cliente (no hace falta, y es información sensible).
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAccessTicket, ArcaNotConfiguredError } from '@/lib/arca/access-ticket'
import { WsaaSoapFaultError } from '@/lib/arca/wsaa'
import { tenantHasArcaFeature } from '@/lib/arca/access'

const MANAGER_ROLES = ['owner', 'admin']

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined

  if (!tenantId || !role || !MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!(await tenantHasArcaFeature(tenantId))) {
    return NextResponse.json({ error: 'La facturación electrónica ARCA requiere el plan PRO' }, { status: 403 })
  }

  try {
    await getAccessTicket(tenantId, 'wsfe')
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof ArcaNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err instanceof WsaaSoapFaultError) {
      return NextResponse.json({ error: `ARCA rechazó el pedido: ${err.message}` }, { status: 400 })
    }
    console.error('[arca/test-wsaa]', err)
    return NextResponse.json({ error: 'No se pudo conectar con WSAA. Revisá los logs del servidor.' }, { status: 500 })
  }
}
