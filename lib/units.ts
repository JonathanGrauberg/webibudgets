/**
 * lib/units.ts
 * Fuente única de verdad para unidades de medida.
 * Define qué tipo de cálculo aplica a cada unidad y cómo computar
 * la cantidad real a partir de las medidas ingresadas por el usuario.
 */

export type UnitType =
  | 'area'       // m², cm², etc. → ancho × alto
  | 'length'     // m, cm, mm, etc. → longitud lineal
  | 'volume'     // m³, L, ml, etc. → ancho × alto × profundidad o litros directos
  | 'weight'     // kg, g, tn → peso directo
  | 'time'       // hr, hs, horas → horas directas
  | 'unit'       // unidad, pieza, etc. → sin calculadora

export interface UnitDef {
  /** Valor canónico que se guarda en DB */
  value: string
  /** Label para mostrar al usuario */
  label: string
  /** Símbolo corto */
  symbol: string
  /** Tipo de cálculo */
  type: UnitType
  /** Descripción de qué mide */
  description: string
}

/** Unidades predefinidas disponibles en el formulario de productos */
export const UNIT_OPTIONS: UnitDef[] = [
  // Área
  { value: 'm²',  label: 'Metro cuadrado (m²)',   symbol: 'm²',  type: 'area',   description: 'Superficies: pisos, paredes, vidrios, telas...' },
  { value: 'cm²', label: 'Centímetro cuadrado',   symbol: 'cm²', type: 'area',   description: 'Superficies pequeñas' },

  // Longitud
  { value: 'm',   label: 'Metro lineal (m)',       symbol: 'm',   type: 'length', description: 'Caños, perfiles, cables, telas por metro...' },
  { value: 'cm',  label: 'Centímetro (cm)',        symbol: 'cm',  type: 'length', description: 'Piezas cortas' },
  { value: 'mm',  label: 'Milímetro (mm)',         symbol: 'mm',  type: 'length', description: 'Precisión alta' },

  // Volumen
  { value: 'm³',  label: 'Metro cúbico (m³)',      symbol: 'm³',  type: 'volume', description: 'Áridos, tierra, hormigón...' },
  { value: 'L',   label: 'Litro (L)',              symbol: 'L',   type: 'volume', description: 'Líquidos, pinturas, combustibles...' },
  { value: 'ml',  label: 'Mililitro (ml)',         symbol: 'ml',  type: 'volume', description: 'Cantidades pequeñas de líquidos' },

  // Peso
  { value: 'kg',  label: 'Kilogramo (kg)',         symbol: 'kg',  type: 'weight', description: 'Materiales a granel, alimentos...' },
  { value: 'g',   label: 'Gramo (g)',              symbol: 'g',   type: 'weight', description: 'Cantidades pequeñas' },
  { value: 'tn',  label: 'Tonelada (tn)',          symbol: 'tn',  type: 'weight', description: 'Cargas grandes' },

  // Tiempo
  { value: 'hr',  label: 'Hora (hr)',              symbol: 'hr',  type: 'time',   description: 'Servicios por hora' },

  // Unidad genérica
  { value: 'un.', label: 'Unidad (un.)',           symbol: 'un.', type: 'unit',   description: 'Piezas individuales, ítems contables' },
  { value: 'kit', label: 'Kit / Conjunto',         symbol: 'kit', type: 'unit',   description: 'Conjuntos o kits' },
  { value: 'gl',  label: 'Global (gl)',            symbol: 'gl',  type: 'unit',   description: 'Servicios cotizados globalmente' },
]

/**
 * Normaliza una string de unidad para detectar su tipo.
 * Acepta variantes libres: "m2", "M2", "metros cuadrados", "metro cuadrado", etc.
 */
export function detectUnitType(unit: string | null | undefined): UnitType {
  if (!unit) return 'unit'

  const u = unit.trim().toLowerCase()

  // Área
  if (/m[²2]|metro[s]?\s*cuadrado[s]?|sq\.?\s*m|sqm|cm[²2]/.test(u)) return 'area'

  // Volumen (antes que longitud para capturar m³)
  if (/m[³3]|metro[s]?\s*[cú]bico[s]?|litro[s]?|^\s*l\s*$|ml|mililitro[s]?/.test(u)) return 'volume'

  // Longitud
  if (/metro[s]?\s*(lineal(es)?)?|^\s*m\s*$|ml\s*$|metro\s*l|cm|centímetro[s]?|mm|milímetro[s]?/.test(u)) return 'length'

  // Peso
  if (/kg|kilogramo[s]?|gramo[s]?|^\s*g\s*$|tonelada[s]?|tn|ton/.test(u)) return 'weight'

  // Tiempo
  if (/hora[s]?|hr[s]?|hs?\.?\s*$/.test(u)) return 'time'

  return 'unit'
}

/**
 * Retorna el UnitDef de la unidad dada (por valor canónico).
 * Si no hay match exacto, retorna un fallback con el tipo detectado.
 */
export function getUnitDef(unit: string | null | undefined): UnitDef {
  if (!unit) return UNIT_OPTIONS.find((u) => u.value === 'un.')!

  const found = UNIT_OPTIONS.find((u) => u.value === unit)
  if (found) return found

  // Fallback: detectar tipo y construir un def ad-hoc
  const type = detectUnitType(unit)
  return {
    value: unit,
    label: unit,
    symbol: unit,
    type,
    description: '',
  }
}

// ---------------------------------------------------------------------------
// Tipos de inputs según UnitType
// ---------------------------------------------------------------------------

export interface CalculatorInputs {
  /** Ancho en la unidad base del producto (ej: metros si es m²) */
  a: number | null
  /** Alto / segunda dimensión */
  b: number | null
  /** Profundidad / tercera dimensión (solo para volumen) */
  c: number | null
  /** Cantidad directa: litros, kg, horas, metros lineales... */
  direct: number | null
}

export interface CalculatorResult {
  /** Cantidad calculada que reemplaza al campo "quantity" del ítem */
  quantity: number
  /** Label descriptivo para mostrar al usuario (ej: "3.20 m²") */
  label: string
  /** true si todos los campos necesarios están completos */
  isComplete: boolean
}

/**
 * Dada la unidad y los inputs del usuario, calcula la cantidad real.
 * El precio unitario NO cambia: es siempre "por unidad de medida".
 * Lo que varía es la cantidad (que puede ser decimal: 2.35 m²).
 */
export function computeQuantity(
  unit: string | null | undefined,
  inputs: CalculatorInputs
): CalculatorResult {
  const type = detectUnitType(unit)
  const sym = getUnitDef(unit).symbol

  switch (type) {
    case 'area': {
      // a = ancho (m o cm según unidad), b = alto
      const w = inputs.a
      const h = inputs.b
      if (!w || !h || w <= 0 || h <= 0) {
        return { quantity: 1, label: '', isComplete: false }
      }

      let area: number
      const u = (unit ?? '').toLowerCase()
      if (/cm[²2]/.test(u)) {
        // ambas dimensiones en cm, resultado en cm²
        area = w * h
      } else {
        // dimensiones en cm, resultado en m²
        area = (w * h) / 10000
      }

      const rounded = Math.round(area * 10000) / 10000
      return {
        quantity: rounded,
        label: `${rounded} ${sym} (${w} cm × ${h} cm)`,
        isComplete: true,
      }
    }

    case 'length': {
      const len = inputs.direct
      if (!len || len <= 0) return { quantity: 1, label: '', isComplete: false }

      let meters: number
      const u = (unit ?? '').toLowerCase()
      if (/mm|milímetro/.test(u)) meters = len / 1000
      else if (/cm|centímetro/.test(u)) meters = len / 100
      else meters = len // ya en metros

      const rounded = Math.round(meters * 10000) / 10000
      return {
        quantity: rounded,
        label: `${len} ${u.includes('cm') ? 'cm' : u.includes('mm') ? 'mm' : 'm'} = ${rounded} ${sym}`,
        isComplete: true,
      }
    }

    case 'volume': {
      const u = (unit ?? '').toLowerCase()
      // Para m³: puede ser ancho × alto × profundidad, o directo
      if (/m[³3]/.test(u) && inputs.a && inputs.b && inputs.c) {
        const vol = (inputs.a * inputs.b * inputs.c) / 1000000 // cm³ → m³
        const rounded = Math.round(vol * 10000) / 10000
        return {
          quantity: rounded,
          label: `${rounded} ${sym} (${inputs.a}cm × ${inputs.b}cm × ${inputs.c}cm)`,
          isComplete: true,
        }
      }
      // Litros / ml / m³ directo
      const vol = inputs.direct
      if (!vol || vol <= 0) return { quantity: 1, label: '', isComplete: false }
      const rounded = Math.round(vol * 10000) / 10000
      return { quantity: rounded, label: `${rounded} ${sym}`, isComplete: true }
    }

    case 'weight': {
      const w = inputs.direct
      if (!w || w <= 0) return { quantity: 1, label: '', isComplete: false }
      const rounded = Math.round(w * 1000) / 1000
      return { quantity: rounded, label: `${rounded} ${sym}`, isComplete: true }
    }

    case 'time': {
      const h = inputs.direct
      if (!h || h <= 0) return { quantity: 1, label: '', isComplete: false }
      return { quantity: h, label: `${h} hr`, isComplete: true }
    }

    default:
      return { quantity: inputs.direct ?? 1, label: '', isComplete: false }
  }
}