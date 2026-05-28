// lib/budget-engine.ts

import { BudgetItemModel, DiscountType } from './budget-model'

interface BudgetCalculationInput {
  items: BudgetItemModel[]
  discountType: DiscountType
  discountValue: number
  taxPercentage: number
}

export interface BudgetCalculationResult {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  items: BudgetItemModel[]
}

/**
 * Motor único de cálculo del sistema
 * (UI, API, PDF, Dashboard usan esto)
 */
export function calculateBudget({
  items,
  discountType,
  discountValue,
  taxPercentage,
}: BudgetCalculationInput): BudgetCalculationResult {
  // 1. Calcular subtotales de items
  const calculatedItems = items.map(item => {
    const base = item.unitPrice * item.quantity
    const itemDiscount = item.discount ?? 0
    const subtotal = Math.max(base - itemDiscount, 0)

    return {
      ...item,
      subtotal,
    }
  })

  // 2. Subtotal general
  const subtotal = calculatedItems.reduce((sum, i) => sum + i.subtotal, 0)

  // 3. Descuento global
  let discountAmount = 0

  if (discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100
  }

  if (discountType === 'fixed') {
    discountAmount = discountValue
  }

  discountAmount = Math.min(discountAmount, subtotal)

  const subtotalWithDiscount = subtotal - discountAmount

  // 4. Impuesto
  const taxAmount = (subtotalWithDiscount * taxPercentage) / 100

  // 5. Total final
  const total = subtotalWithDiscount + taxAmount

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    items: calculatedItems,
  }
}
