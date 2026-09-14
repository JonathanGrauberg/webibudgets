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
