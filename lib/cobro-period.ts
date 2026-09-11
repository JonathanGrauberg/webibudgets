//lib\cobro-period.ts
//
// Un Cobro pertenece a un mes calendario — lo normalizamos siempre al día 1
// (UTC) para que agrupar/comparar períodos sea directo, sin parsear fechas.

export function parsePeriodMonth(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1))
  }
  // Acepta "YYYY-MM" o cualquier string parseable por Date
  const match = /^(\d{4})-(\d{2})$/.exec(input)
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
  }
  const parsed = new Date(input)
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
}

export function nextPeriodMonth(period: Date): Date {
  return new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + 1, 1))
}

export function periodLabel(period: Date): string {
  return period.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function periodKey(period: Date): string {
  return `${period.getUTCFullYear()}-${String(period.getUTCMonth() + 1).padStart(2, '0')}`
}
