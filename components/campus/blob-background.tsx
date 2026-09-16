// components/campus/blob-background.tsx
//
// Fondo decorativo de manchas orgánicas ("blobs"), inspirado en el estilo
// de portadas de e-learning/landing que se comparte como referencia — pero
// con la paleta de marca (amarillo .budgets) en vez de copiar los colores
// del ejemplo. Puro CSS (border-radius asimétrico + blur), sin SVG ni
// imágenes — así no pesa nada y se banca cualquier ancho de pantalla.
//
// Usar dentro de un contenedor con `relative overflow-hidden`, como
// primer hijo, y el contenido real arriba con z-10.

export function BlobBackground({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const scale = variant === 'compact' ? 0.75 : 1

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute bg-primary/20 blur-3xl dark:bg-primary/10"
        style={{
          width: 420 * scale,
          height: 420 * scale,
          top: -140 * scale,
          left: -120 * scale,
          borderRadius: '62% 38% 33% 67% / 58% 33% 67% 42%',
        }}
      />
      <div
        className="absolute bg-amber-400/25 blur-3xl dark:bg-amber-400/10"
        style={{
          width: 480 * scale,
          height: 480 * scale,
          top: -160 * scale,
          right: -160 * scale,
          borderRadius: '38% 62% 65% 35% / 42% 68% 32% 58%',
        }}
      />
      <div
        className="absolute bg-orange-300/20 blur-3xl dark:bg-orange-400/10"
        style={{
          width: 300 * scale,
          height: 300 * scale,
          bottom: -120 * scale,
          left: '30%',
          borderRadius: '70% 30% 50% 50% / 30% 60% 40% 70%',
        }}
      />
    </div>
  )
}
