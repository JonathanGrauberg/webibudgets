// components/branded-loader.tsx
//
// Pantalla de carga de marca — reemplaza los skeletons/spinners sueltos en
// los momentos de "carga de página" (boot inicial, cambio de ruta) por algo
// consistente en toda la app: fondo blanco fijo (a propósito, no sigue el
// tema oscuro — es una splash, no contenido) con ".budgets" en dorado,
// cada letra con un rebote sutil escalonado, y tres puntitos animados abajo.
export function BrandedLoader() {
  const letters = '.budgets'.split('')

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-white">
      <p role="status" aria-label="Cargando .budgets" className="flex text-4xl font-black tracking-tight sm:text-5xl">
        {letters.map((char, i) => (
          <span
            key={i}
            className="inline-block animate-budgets-letter"
            style={{ color: '#fcc107', animationDelay: `${i * 80}ms` }}
          >
            {char}
          </span>
        ))}
      </p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-budgets-dot"
            style={{ backgroundColor: '#fcc107', animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
