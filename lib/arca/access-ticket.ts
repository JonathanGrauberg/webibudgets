//lib\arca\access-ticket.ts
//
// Punto de entrada de alto nivel: "dame un Ticket de Acceso (TA) válido
// para este tenant y este servicio". Reutiliza el TA cacheado si todavía
// tiene margen de vigencia (ARCA pide explícitamente no pedir uno nuevo
// mientras el actual sirva), y si no, pide uno nuevo a WSAA y lo guarda.
import { prisma } from '@/lib/prisma'
import { decryptPrivateKey } from '@/lib/arca/crypto'
import { requestAccessTicket } from '@/lib/arca/wsaa'

// Margen de seguridad — si al TA le quedan menos de 5 minutos, pedimos uno
// nuevo antes de arriesgarnos a que venza en medio de una operación.
const SAFETY_MARGIN_MS = 5 * 60 * 1000

export class ArcaNotConfiguredError extends Error {
  constructor() {
    super('Este tenant todavía no tiene un certificado de ARCA activo')
    this.name = 'ArcaNotConfiguredError'
  }
}

export async function getAccessTicket(tenantId: string, service: string): Promise<{ token: string; sign: string }> {
  const credential = await prisma.arcaCredential.findUnique({ where: { tenantId } })

  if (!credential || credential.status !== 'active' || !credential.certificatePem || !credential.privateKeyEncrypted) {
    throw new ArcaNotConfiguredError()
  }

  const cachedIsValid =
    credential.wsaaService === service &&
    credential.wsaaToken &&
    credential.wsaaSign &&
    credential.wsaaTokenExpiresAt &&
    credential.wsaaTokenExpiresAt.getTime() - SAFETY_MARGIN_MS > Date.now()

  if (cachedIsValid) {
    return { token: credential.wsaaToken!, sign: credential.wsaaSign! }
  }

  const privateKeyPem = decryptPrivateKey(credential.privateKeyEncrypted)
  const { token, sign, expirationTime } = await requestAccessTicket({
    service,
    certificatePem: credential.certificatePem,
    privateKeyPem,
    environment: credential.environment as 'testing' | 'production',
  })

  await prisma.arcaCredential.update({
    where: { tenantId },
    data: {
      wsaaToken: token,
      wsaaSign: sign,
      wsaaTokenExpiresAt: expirationTime,
      wsaaService: service,
    },
  })

  return { token, sign }
}
