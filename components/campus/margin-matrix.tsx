// components/campus/margin-matrix.tsx
//
// Grilla 2x2 decorativa para la "Matriz de Margen" — reemplaza la tabla
// markdown por algo visual, usando la paleta de color provista para
// diferenciar cada cuadrante de un vistazo.
import type { MatrizCuadrante } from '@/lib/guias-data'

export function MarginMatrix({ cuadrantes }: { cuadrantes: MatrizCuadrante[] }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {cuadrantes.map((c) => (
        <div
          key={c.numero}
          className="rounded-2xl border border-border p-5"
          style={{ borderTopWidth: 4, borderTopColor: c.color }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.numero}
            </span>
            <h4 className="text-sm font-bold">{c.nombre}</h4>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>Volumen: <strong className="text-foreground">{c.volumen}</strong></span>
            <span>Margen: <strong className="text-foreground">{c.margen}</strong></span>
          </div>
          <p className="mt-2 text-sm text-foreground/80">{c.funcion}</p>
        </div>
      ))}
    </div>
  )
}
