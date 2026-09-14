//app\api\arca\generate-csr\route.ts
//
// Paso 1 de facturación electrónica: generamos clave privada + CSR para
// que el tenant lo suba a ARCA (WSASS si es testing, Administrador de
// Certificados Digitales si es producción) y consiga su certificado.
// La clave privada NUNCA sale de acá — se guarda cifrada, y esta ruta
// devuelve únicamente el CSR (que no es secreto, es justamente lo que hay
// que entregarle a ARCA).
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { generateArcaCsr } from '@/lib/arca/certificate'
import { encryptPrivateKey } from '@/lib/arca/crypto'

const MANAGER_ROLES = ['owner', 'admin']

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  const role = token?.role as string | undefined

  if (!tenantId || !role || !MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const data = await req.json().catch(() => ({}))
  const cuit = String(data?.cuit ?? '').replace(/\D/g, '')
  const organizationName = String(data?.organizationName ?? '').trim()
  const commonName = String(data?.commonName ?? '').trim()
  const alias = String(data?.alias ?? '').trim()
  const environment = data?.environment === 'production' ? 'production' : 'testing'

  if (cuit.length !== 11) {
    return NextResponse.json({ error: 'El CUIT debe tener 11 dígitos, sin guiones' }, { status: 400 })
  }
  if (!organizationName) {
    return NextResponse.json({ error: 'Falta el nombre de la empresa (para el campo O del certificado)' }, { status: 400 })
  }
  if (!commonName) {
    return NextResponse.json({ error: 'Falta el nombre/alias técnico (para el campo CN del certificado)' }, { status: 400 })
  }

  try {
    const { privateKeyPem, csrPem } = generateArcaCsr({ cuit, organizationName, commonName })
    const privateKeyEncrypted = encryptPrivateKey(privateKeyPem)

    await prisma.arcaCredential.upsert({
      where: { tenantId },
      update: {
        cuit,
        environment,
        alias: alias || null,
        privateKeyEncrypted,
        certificatePem: null, // 👈 clave nueva → el certificado viejo (si había) ya no le corresponde
        status: 'pending_csr',
      },
      create: {
        tenantId,
        cuit,
        environment,
        alias: alias || null,
        privateKeyEncrypted,
        status: 'pending_csr',
      },
    })

    return NextResponse.json({ csr: csrPem })
  } catch (err) {
    console.error('[arca/generate-csr]', err)
    return NextResponse.json({ error: 'No pudimos generar el certificado. Probá de nuevo.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const tenantId = token?.tenantId as string | undefined
  if (!tenantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const credential = await prisma.arcaCredential.findUnique({
    where: { tenantId },
    select: {
      cuit: true,
      environment: true,
      alias: true,
      puntoVenta: true,
      status: true,
      // 👇 nunca devolvemos privateKeyEncrypted ni certificatePem completos acá
    },
  })

  return NextResponse.json(credential)
}
