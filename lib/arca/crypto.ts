//lib\arca\crypto.ts
//
// Cifrado de la clave privada del certificado de ARCA — es lo más sensible
// que va a guardar todo el sistema hasta ahora: si alguien la obtiene,
// puede facturar en nombre del negocio del tenant con responsabilidad
// fiscal real para ellos. Por eso NO se guarda en texto plano como el
// token de Mercado Pago — va cifrada con AES-256-GCM usando una clave
// maestra que vive solo en las variables de entorno del servidor, nunca
// en la base de datos.
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // recomendado para GCM

function getMasterKey(): Buffer {
  const secret = process.env.ARCA_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('Falta ARCA_ENCRYPTION_KEY en las variables de entorno del servidor')
  }
  // 👇 derivamos una clave de 32 bytes a partir del secreto — así no importa
  // si el secreto en .env es un string cualquiera en vez de hex/base64 exacto
  return scryptSync(secret, 'arca-private-key-salt', 32)
}

export function encryptPrivateKey(plainTextPem: string): string {
  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plainTextPem, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Empaquetamos iv + authTag + ciphertext en un solo string base64,
  // separados por ".", para poder guardarlo en una sola columna de texto.
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.')
}

export function decryptPrivateKey(packed: string): string {
  const [ivB64, authTagB64, dataB64] = packed.split('.')
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Formato de clave cifrada inválido')
  }
  const key = getMasterKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}
