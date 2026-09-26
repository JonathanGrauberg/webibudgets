// lib/currencies.ts

export interface CurrencyConfig {
  code: string
  name: string
  locale: string // para Intl.NumberFormat
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  ARS: { code: 'ARS', name: 'Peso Argentino', locale: 'es-AR' },
  VES: { code: 'VES', name: 'Bolívar (Venezuela)', locale: 'es-VE' },
  CLP: { code: 'CLP', name: 'Peso Chileno', locale: 'es-CL' },
  BOB: { code: 'BOB', name: 'Boliviano (Bolivia)', locale: 'es-BO' },
  COP: { code: 'COP', name: 'Peso Colombiano', locale: 'es-CO' },
  PEN: { code: 'PEN', name: 'Sol Peruano', locale: 'es-PE' },
  MXN: { code: 'MXN', name: 'Peso Mexicano', locale: 'es-MX' },
  // 👇 locale es-AR (no en-US) a propósito — así Intl.NumberFormat lo
  // muestra como "US$" en vez de un "$" ambiguo e indistinguible del peso
  // argentino (ver conversación: un cliente interpretó "$400" en dólares
  // como pesos, porque así se veía en el PDF).
  USD: { code: 'USD', name: 'Dólar Estadounidense', locale: 'es-AR' },
  EUR: { code: 'EUR', name: 'Euro', locale: 'de-DE' },
}

export const DEFAULT_CURRENCY = 'ARS'

export function isValidCurrency(code: unknown): code is string {
  return typeof code === 'string' && code in SUPPORTED_CURRENCIES
}

export function normalizeCurrency(code: unknown, fallback: string = DEFAULT_CURRENCY): string {
  return isValidCurrency(code) ? code : fallback
}