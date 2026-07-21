// lib/format.ts
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from './currencies'

export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] ?? SUPPORTED_CURRENCIES[DEFAULT_CURRENCY]

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
    }).format(amount)
  } catch {
    // Fallback por si el runtime no reconoce el código ISO
    return `${config.code} ${amount.toFixed(2)}`
  }
}

export function formatHoursAsClock(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}HS`
}