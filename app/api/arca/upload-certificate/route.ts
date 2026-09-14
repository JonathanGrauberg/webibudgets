//app\api\arca\upload-certificate\route.ts
//
// Paso 2: el tenant ya subió el CSR a ARCA y le devolvieron un
// certificado (.crt). Lo valida contra la clave privada que generamos
// nosotros (tienen que ser el mismo par, si no el certificado es
// inservible) y recién ahí lo guarda.
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { parseAndVerifyCertificate, CertificateKeyMismatchError } from '@/lib/arca/certificate'
import { decryptPrivateKey } from '@/lib/arca/crypto'
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

  const data = await req.json().catch(() => ({}))
  const certificatePem = String(data?.certificatePem ?? '').trim()

  if (!certificatePem.includes('BEGIN CERTIFICATE')) {
    return NextResponse.json({ error: 'Eso no parece un certificado .crt/.pem válido (tiene que empezar con "-----BEGIN CERTIFICATE-----")' }, { status: 400 })
  }

  const credential = await prisma.arcaCredential.findUnique({ where: { tenantId } })
  if (!credential || !credential.privateKeyEncrypted) {
    return NextResponse.json({ error: 'Primero tenés que generar el certificado (CSR) desde acá' }, { status: 400 })
  }

  try {
    const privateKeyPem = decryptPrivateKey(credential.privateKeyEncrypted)
    const { expiresAt } = parseAndVerifyCertificate({ certificatePem, privateKeyPem })

    await prisma.arcaCredential.update({
      where: { tenantId },
      data: {
        certificatePem,
        certificateExpiresAt: expiresAt,
        status: 'active',
      },
    })

    return NextResponse.json({ ok: true, expiresAt })
  } catch (err) {
    if (err instanceof CertificateKeyMismatchError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[arca/upload-certificate]', err)
    return NextResponse.json({ error: 'No se pudo procesar el certificado' }, { status: 500 })
  }
}
