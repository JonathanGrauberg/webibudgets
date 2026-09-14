//lib\arca\certificate.ts
//
// Genera el par clave privada + CSR (Certificate Signing Request) que
// ARCA exige para dar de alta un certificado digital — mismo formato que
// piden sus instructivos oficiales, replicado acá en JS puro (node-forge)
// en vez de invocar el binario de OpenSSL del sistema, para que funcione
// igual en cualquier entorno (incluido serverless).
//
// Fuente: "Generación de Certificados para Producción" (AFIP/ARCA,
// wsaa.obtenercertificado.pdf) — el comando de referencia es:
//   openssl genrsa -out privada 2048
//   openssl req -new -key privada \
//     -subj "/C=AR/O=<empresa>/CN=<nombre>/serialNumber=CUIT <cuit>" \
//     -out pedido
import forge from 'node-forge'

const KEY_SIZE_BITS = 2048

export function generateArcaCsr(params: {
  cuit: string // sin guiones
  organizationName: string
  commonName: string
}): { privateKeyPem: string; csrPem: string } {
  const cuit = params.cuit.replace(/\D/g, '')
  if (cuit.length !== 11) {
    throw new Error('El CUIT debe tener 11 dígitos, sin guiones')
  }

  const keys = forge.pki.rsa.generateKeyPair(KEY_SIZE_BITS)

  const csr = forge.pki.createCertificationRequest()
  csr.publicKey = keys.publicKey

  // 👇 mismo orden y campos que exige ARCA: C, O, CN, serialNumber="CUIT <n>"
  csr.setSubject([
    { shortName: 'C', value: 'AR' },
    { name: 'organizationName', value: params.organizationName },
    { name: 'commonName', value: params.commonName },
    { name: 'serialNumber', value: `CUIT ${cuit}` }, // OID 2.5.4.5
  ])

  csr.sign(keys.privateKey, forge.md.sha256.create())

  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)
  const csrPem = forge.pki.certificationRequestToPem(csr)

  return { privateKeyPem, csrPem }
}

export class CertificateKeyMismatchError extends Error {
  constructor() {
    super('Este certificado no corresponde a la clave privada generada acá — subiste el certificado equivocado, o el CSR que usaste para pedirlo era de otro momento')
    this.name = 'CertificateKeyMismatchError'
  }
}

// Valida el .crt que ARCA le devuelve al tenant, y confirma que la clave
// pública que trae el certificado coincide con la clave privada que
// generamos nosotros — si no coincide, el certificado es inútil (nadie
// podría firmar nada con él) y hay que detectarlo ACÁ, no en producción
// en medio de un intento de facturar.
export function parseAndVerifyCertificate(params: {
  certificatePem: string
  privateKeyPem: string
}): { expiresAt: Date } {
  let cert: forge.pki.Certificate
  try {
    cert = forge.pki.certificateFromPem(params.certificatePem)
  } catch {
    throw new Error('El archivo no es un certificado PEM válido')
  }

  let privateKey: forge.pki.rsa.PrivateKey
  try {
    privateKey = forge.pki.privateKeyFromPem(params.privateKeyPem) as forge.pki.rsa.PrivateKey
  } catch {
    throw new Error('No se pudo leer la clave privada guardada — regenerá el certificado de nuevo')
  }

  const certPublicKey = cert.publicKey as forge.pki.rsa.PublicKey
  const matches = certPublicKey.n.equals(privateKey.n) && certPublicKey.e.equals(privateKey.e)

  if (!matches) {
    throw new CertificateKeyMismatchError()
  }

  return { expiresAt: cert.validity.notAfter }
}
