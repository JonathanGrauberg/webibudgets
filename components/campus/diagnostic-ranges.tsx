// components/campus/diagnostic-ranges.tsx
//
// Tarjetas de diagnóstico por rango — mismo lenguaje visual que
// MarginMatrix, para tablas de "según tu número, tu situación es esta,
// hacé esto". Reemplaza tablas markdown por algo más fácil de escanear.
import type { DiagnosticoRango } from '@/lib/guias-data'

export function DiagnosticRanges({ formula, rangos }: { formula?: string; rangos: DiagnosticoRango[] }) {
  return (
    <div className="mt-6">
      {formula && (
        <div className="rounded-xl bg-muted/60 px-4 py-3 text-center font-mono text-sm text-foreground/90">
          {formula}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {rangos.map((r) => (
          <div
            key={r.etiqueta}
            className="flex flex-col gap-1 rounded-2xl border border-border p-5 sm:flex-row sm:items-start sm:gap-5"
            style={{ borderLeftWidth: 4, borderLeftColor: r.color }}
          >
            <span
              className="inline-block w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white sm:w-32 sm:text-center"
              style={{ backgroundColor: r.color }}
            >
              {r.etiqueta}
            </span>
            <div className="text-sm">
              <p className="font-semibold text-foreground">{r.diagnostico}</p>
              <p className="mt-1 text-muted-foreground">{r.accion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
