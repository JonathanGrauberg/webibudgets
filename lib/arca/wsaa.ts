//lib\arca\wsaa.ts
//
// WSAA — Web Service de Autenticación y Autorización de ARCA. Antes de
// poder llamar a cualquier otro webservice (WSFEv1, etc.) hay que pedirle
// acá un "Ticket de Acceso" (TA), válido 12hs, firmando un pedido (TRA)
// con el certificado del tenant.
//
// Fuente: "Especificación Técnica del WebService de Autenticación y
// Autorización" (ARCA) — flujo: generar LoginTicketRequest.xml → firmarlo
// como CMS SignedData (SHA1+RSA) → base64 → invocar loginCms → parsear
// LoginTicketResponse.xml (token + sign).
//
// Verificado el armado del CMS de forma independiente con `openssl cms
// -verify` antes de dar este módulo por bueno (ver conversación).
import forge from 'node-forge'
import { XMLParser } from 'fast-xml-parser'

const WSAA_URLS: Record<'testing' | 'production', string> = {
  testing: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// ARCA exige el offset de zona horaria en el formato ISO 8601 con ":"
// (ej: "-03:00") — el toISOString() nativo de JS no lo da en ese formato.
function isoWithOffset(date: Date): string {
  const tzOffsetMin = -date.getTimezoneOffset()
  const sign = tzOffsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(tzOffsetMin)
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`
}

export function buildLoginTicketRequestXml(service: string): string {
  const now = new Date()
  const expiration = new Date(now.getTime() + 10 * 60 * 1000) // 10 min alcanza — la tolerancia real de ARCA es de 24hs
  const uniqueId = Math.floor(now.getTime() / 1000)

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${isoWithOffset(now)}</generationTime>
    <expirationTime>${isoWithOffset(expiration)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`
}

// Firma el TRA como CMS SignedData (SHA1+RSA, contenido incluido — no
// detached, porque ARCA necesita poder leer el XML directo del CMS).
export function signTra(traXml: string, certificatePem: string, privateKeyPem: string): string {
  const cert = forge.pki.certificateFromPem(certificatePem)
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)

  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(traXml, 'utf8')
  p7.addCertificate(cert)
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha1,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest }, // se completa solo al firmar
      // 👇 @types/node-forge tipa "value" como string nomás, pero forge
      // acepta (y espera) un Date acá — verificado en runtime con el test
      // de CMS (openssl cms -verify confirmó la firma válida).
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  })
  p7.sign()

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
  return forge.util.encode64(der)
}

export class WsaaSoapFaultError extends Error {}

// 👇 Sin librería de SOAP de terceros — el WSDL de WSAA es mínimo (un solo
// método, un string de entrada y uno de salida), así que arma el sobre a
// mano en vez de sumar una dependencia genérica para esto solo.
export async function callWsaaLoginCms(cmsBase64: string, environment: 'testing' | 'production'): Promise<string> {
  const url = WSAA_URLS[environment]
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
      <in0>${cmsBase64}</in0>
    </loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
    },
    body: envelope,
  })

  const text = await res.text()
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true })
  const parsed = parser.parse(text)

  const fault = parsed?.Envelope?.Body?.Fault
  if (fault) {
    const message = fault.faultstring ?? 'Error desconocido de WSAA'
    throw new WsaaSoapFaultError(String(message))
  }

  const loginCmsReturn = parsed?.Envelope?.Body?.loginCmsResponse?.loginCmsReturn
  if (!loginCmsReturn) {
    console.error('[wsaa] Respuesta inesperada:', text.slice(0, 1000))
    throw new Error('Respuesta inesperada de WSAA — ver logs del servidor')
  }

  return String(loginCmsReturn)
}

export function parseLoginTicketResponse(xml: string): { token: string; sign: string; expirationTime: Date } {
  const parser = new XMLParser({ ignoreAttributes: false })
  const parsed = parser.parse(xml)
  const response = parsed?.loginTicketResponse
  if (!response?.credentials?.token || !response?.credentials?.sign) {
    throw new Error('No se pudo interpretar el LoginTicketResponse de ARCA')
  }

  return {
    token: String(response.credentials.token),
    sign: String(response.credentials.sign),
    expirationTime: new Date(response.header.expirationTime),
  }
}

// Punto de entrada único: firma, invoca WSAA, y devuelve el TA listo para
// usar. No cachea acá adentro — eso vive en getAccessTicket (lib/arca/access-ticket.ts)
// para poder reutilizar el TA entre llamadas (son válidos 12hs, y ARCA
// pide explícitamente no pedir uno nuevo mientras el actual sirva).
export async function requestAccessTicket(params: {
  service: string
  certificatePem: string
  privateKeyPem: string
  environment: 'testing' | 'production'
}): Promise<{ token: string; sign: string; expirationTime: Date }> {
  const traXml = buildLoginTicketRequestXml(params.service)
  const cmsBase64 = signTra(traXml, params.certificatePem, params.privateKeyPem)
  const responseXml = await callWsaaLoginCms(cmsBase64, params.environment)
  return parseLoginTicketResponse(responseXml)
}
