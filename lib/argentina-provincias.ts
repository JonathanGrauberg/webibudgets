// lib/argentina-provincias.ts
//
// Las 24 provincias de Argentina — lista fija y estable (no cambia), con
// el mismo `id` que usa la API Georef (datos.gob.ar) para poder filtrar
// localidades por provincia. Ver components/city-autocomplete.tsx.

export interface Provincia {
  id: string
  nombre: string
}

export const PROVINCIAS_ARGENTINA: Provincia[] = [
  { id: '06', nombre: 'Buenos Aires' },
  { id: '02', nombre: 'Ciudad Autónoma de Buenos Aires' },
  { id: '10', nombre: 'Catamarca' },
  { id: '22', nombre: 'Chaco' },
  { id: '26', nombre: 'Chubut' },
  { id: '14', nombre: 'Córdoba' },
  { id: '18', nombre: 'Corrientes' },
  { id: '30', nombre: 'Entre Ríos' },
  { id: '34', nombre: 'Formosa' },
  { id: '38', nombre: 'Jujuy' },
  { id: '42', nombre: 'La Pampa' },
  { id: '46', nombre: 'La Rioja' },
  { id: '50', nombre: 'Mendoza' },
  { id: '54', nombre: 'Misiones' },
  { id: '58', nombre: 'Neuquén' },
  { id: '62', nombre: 'Río Negro' },
  { id: '66', nombre: 'Salta' },
  { id: '70', nombre: 'San Juan' },
  { id: '74', nombre: 'San Luis' },
  { id: '78', nombre: 'Santa Cruz' },
  { id: '82', nombre: 'Santa Fe' },
  { id: '86', nombre: 'Santiago del Estero' },
  { id: '90', nombre: 'Tucumán' },
  { id: '94', nombre: 'Tierra del Fuego, Antártida e Islas del Atlántico Sur' },
]

export function findProvinciaByNombre(nombre: string): Provincia | undefined {
  const normalized = nombre.trim().toLowerCase()
  return PROVINCIAS_ARGENTINA.find((p) => p.nombre.toLowerCase() === normalized)
}
