export type WhatsappCountry = 'AR' | 'VE' | 'CO'

interface CountryConfig {
  label: string
  dialCode: string // sin el +
  mobilePrefix: string // AR usa "9" antes del código de área para celulares; VE/CO no tienen este quirk
  areaCodeLength: [number, number] // rango típico, solo para el placeholder/ayuda, no validación estricta
  example: string
}

export const WHATSAPP_COUNTRIES: Record<WhatsappCountry, CountryConfig> = {
  AR: { label: 'Argentina', dialCode: '54', mobilePrefix: '9', areaCodeLength: [2, 4], example: '343 6959359' },
  VE: { label: 'Venezuela', dialCode: '58', mobilePrefix: '', areaCodeLength: [3, 3], example: '412 1234567' },
  CO: { label: 'Colombia', dialCode: '57', mobilePrefix: '', areaCodeLength: [3, 3], example: '300 1234567' },
}

/**
 * Arma el número final en formato E.164 sin "+" (lo que espera wa.me),
 * a partir del país y el resto de los dígitos que tipeó el usuario (área + número, sin espacios).
 */
export function buildWhatsappNumber(country: WhatsappCountry, restDigits: string): string {
  const config = WHATSAPP_COUNTRIES[country]
  const cleanRest = restDigits.replace(/\D/g, '')
  return `${config.dialCode}${config.mobilePrefix}${cleanRest}`
}

/** Valida que el número final tenga una longitud razonable (entre 10 y 13 dígitos totales). */
export function isValidWhatsappNumber(fullNumber: string): boolean {
  return /^\d{10,13}$/.test(fullNumber)
}

/** Formato lindo para mostrar en UI, ej: +54 9 343 6959359 */
export function formatWhatsappDisplay(fullNumber: string | null | undefined): string | null {
  if (!fullNumber) return null
  return `+${fullNumber}`
}

/** Link de WhatsApp con mensaje predefinido, listo para abrir en una pestaña nueva. */
export function buildWhatsappLink(fullNumber: string, message?: string): string {
  const base = `https://wa.me/${fullNumber}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}