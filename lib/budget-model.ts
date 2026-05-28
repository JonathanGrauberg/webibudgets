// lib/budget-model.ts

export type DiscountType = 'percentage' | 'fixed' | null

export type BudgetStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'revised'

export type BudgetItemType =
  | 'product'
  | 'service'
  | 'fee'
  | 'discount'
  | 'custom'

export interface BudgetItemModel {
  id: string

  // Relación (opcional para items custom)
  productServiceId?: string

  name: string
  description?: string

  type: BudgetItemType

  quantity: number
  unitPrice: number

  // Descuento por item
  discount?: number // valor absoluto

  subtotal: number
}

export interface BudgetModel {
  id: string
  clientId: string

  // Metadata comercial
  referenceCode: string   // ej: ECO-2026-0001
  version: number         // versionado de presupuesto

  items: BudgetItemModel[]

  // Cálculos
  subtotal: number

  discountType: DiscountType
  discountValue: number   // % o valor fijo

  taxPercentage: number   // ej: 21
  taxAmount: number

  total: number

  // Estado
  status: BudgetStatus

  // Info comercial
  notes?: string
  paymentTerms?: string
  validUntil?: Date
  sellerName?: string

  createdAt: Date
  updatedAt: Date
}
