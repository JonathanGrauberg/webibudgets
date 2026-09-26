// lib/rendicion-period.ts
//
// Cuánto se cobró de un presupuesto DURANTE un período puntual (no
// acumulado desde el origen del trabajo). Antes, "Cobrado"/"Ganancia
// repartible" en Rendiciones mostraban el total cobrado ALGUNA VEZ,
// capado al total del trabajo — así que un presupuesto pagado en cuotas
// mostraba (y repartía) la plata de cuotas de meses anteriores cada vez
// que se generaba una rendición nueva, como si se hubiera vuelto a
// cobrar/repartir ese mismo dinero. Acá restamos "cobrado hasta el final
// del período" menos "cobrado antes de que arrancara el período" — cada
// cuota cuenta una sola vez, en el período exacto en que entró.
export interface PeriodMovement {
  amount: number
  date: Date
}

export function collectedDuringPeriod(
  movements: PeriodMovement[],
  total: number,
  periodStart: Date,
  periodEnd: Date
): number {
  const beforeStart = movements
    .filter((m) => m.date < periodStart)
    .reduce((acc, m) => acc + m.amount, 0)
  const throughEnd = movements
    .filter((m) => m.date <= periodEnd)
    .reduce((acc, m) => acc + m.amount, 0)

  // 👇 cada acumulado se capa por separado al total del trabajo (por si
  // alguien pagó de más) ANTES de restar, para no arrastrar un exceso de
  // un lado a otro.
  const cappedBefore = Math.min(beforeStart, total)
  const cappedThrough = Math.min(throughEnd, total)
  return Math.max(cappedThrough - cappedBefore, 0)
}
