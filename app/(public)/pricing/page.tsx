// app/(public)/pricing/page.tsx
//
// Esta página mostraba los planes viejos (Starter/Team/Business, ya
// desestimados — ver lib/plan.ts). El pricing real y actualizado (Free +
// Pro, $40.000/mes o $432.000/año) vive directo en la landing, sección
// #pricing (components/landing/landing-sections.tsx). Redirigimos en vez
// de borrar la ruta, por si quedó algún link viejo indexado o guardado.

import { redirect } from 'next/navigation'

export default function PricingPage() {
  redirect('/#pricing')
}
