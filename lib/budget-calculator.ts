//lib\budget-calculator.ts 
export type BudgetRequestItem = {
  productServiceId: string | null
  quantity: number
  unitPrice: number
  discount?: number
  customName?: string | null
  isCustom?: boolean
  // Campos de la calculadora (solo se usan si el tenant tiene el módulo activo)
  widthCm?: number | null
  heightCm?: number | null
  depthCm?: number | null
  direct?: number | null
  hours?: number | null
}

export type NormalizedBudgetItem = {
  productServiceId: string | null
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  customName: string | null
  isCustom: boolean
  widthCm: number | null
  heightCm: number | null
  depthCm: number | null
  direct: number | null
  hours: number | null
  calculatedM2: number | null
}

export type BudgetCalculationInput = {
  items: NormalizedBudgetItem[]
  discountType: 'percentage' | 'fixed' | null
  discountValue: number
  taxPercentage: number
  shippingCost?: number | null
}

export type BudgetCalculationResult = {
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingCost: number | null
  total: number
  items: NormalizedBudgetItem[]
}

/** Calcula m² a partir de ancho/alto en cm, redondeado a 2 decimales. null si falta algún valor. */
function computeCalculatedM2(widthCm: number | null, heightCm: number | null): number | null {
  if (!widthCm || !heightCm) return null
  const m2 = (widthCm * heightCm) / 10000
  return Math.round(m2 * 100) / 100
}

/** Parsea un número opcional (acepta decimales), null si no es válido o no vino */
function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export function normalizeBudgetItems(items: unknown[]): NormalizedBudgetItem[] {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array')
  }

  return items
    .map((item: any) => {
      const rawProductServiceId = typeof item?.productServiceId === 'string' ? item.productServiceId.trim() : ''
      const customName = typeof item?.customName === 'string' ? item.customName.trim() : ''
      const isCustom = Boolean(item?.isCustom) || customName.length > 0 || rawProductServiceId.length === 0

      // 👈 quantity acepta decimales (m², litros, kg...) — requiere quantity Float en el schema
      const quantity = Math.max(0, Number(item?.quantity) || 0)
      const unitPrice = Math.max(0, Number(item?.unitPrice) || 0)
      const discount = Math.max(0, Number(item?.discount ?? 0) || 0)

      const widthCm = parseOptionalNumber(item?.widthCm)
      const heightCm = parseOptionalNumber(item?.heightCm)
      const depthCm = parseOptionalNumber(item?.depthCm)
      const direct = parseOptionalNumber(item?.direct)
      const hours = parseOptionalNumber(item?.hours)
      const calculatedM2 = computeCalculatedM2(widthCm, heightCm)

      return {
        productServiceId: isCustom ? null : rawProductServiceId,
        quantity,
        unitPrice,
        discount,
        subtotal: quantity * unitPrice,
        customName: isCustom ? (customName || 'Ítem personalizado') : null,
        isCustom,
        widthCm,
        heightCm,
        depthCm,
        direct,
        hours,
        calculatedM2,
      }
    })
    .filter((item) => item.quantity > 0 && (item.isCustom ? !!item.customName : !!item.productServiceId))
}

export function getBudgetItemProductIds(items: NormalizedBudgetItem[]) {
  return Array.from(
    new Set(
      items
        .filter((item) => !item.isCustom && item.productServiceId)
        .map((item) => item.productServiceId as string)
    )
  )
}

export function groupBudgetItemQuantities(items: NormalizedBudgetItem[]) {
  return items.reduce<Map<string, number>>((grouped, item) => {
    if (item.isCustom || !item.productServiceId) return grouped
    grouped.set(item.productServiceId, (grouped.get(item.productServiceId) ?? 0) + item.quantity)
    return grouped
  }, new Map())
}

export function parseShippingCost(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0
  }

  return Math.max(0, parsed)
}

export function calculateBudgetTotals({
  items,
  discountType,
  discountValue,
  taxPercentage,
  shippingCost,
}: BudgetCalculationInput): BudgetCalculationResult {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)

  let discountAmount = 0

  if (discountType === 'percentage') {
    discountAmount = subtotal * (Math.min(100, Math.max(0, discountValue)) / 100)
  } else if (discountType === 'fixed') {
    discountAmount = Math.max(0, discountValue)
  }

  discountAmount = Math.min(discountAmount, subtotal)

  const taxedBase = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxedBase * (Math.max(0, taxPercentage) / 100)

  // Solo para la cuenta del total, nunca se guarda ni se devuelve
  const shippingAmountForTotal = shippingCost === null || shippingCost === undefined ? 0 : Math.max(0, shippingCost)
  const total = taxedBase + taxAmount + shippingAmountForTotal

  // Normalizamos el valor original: null se mantiene null, negativos/NaN quedan en null también
  const normalizedShippingCost =
    shippingCost === null || shippingCost === undefined ? null : Math.max(0, shippingCost)

  return {
    subtotal,
    discountAmount,
    taxAmount,
    shippingCost: normalizedShippingCost, // 👈 ahora sí propaga el null
    total,
    items,
  }
}