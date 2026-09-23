// app/loading.tsx
//
// Boundary de carga a nivel raíz — Next.js lo muestra en el primer load y
// en cualquier navegación de ruta que no tenga su propio loading.tsx más
// específico. Reemplaza el "nada" que se veía antes en esos momentos.
import { BrandedLoader } from '@/components/branded-loader'

export default function RootLoading() {
  return <BrandedLoader />
}
