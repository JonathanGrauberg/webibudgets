import { prisma } from '@/lib/prisma'
import type { NormalizedBudgetItem } from './budget-calculator'

export type TenantValidationResult = {
  clientId: string
  sellerId: string | null
  installerId: string | null
}

export function normalizeRelationId(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function validateBudgetClient(tenantId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true },
  })
  return client !== null
}

export async function validateBudgetSeller(tenantId: string, sellerId: string | null) {
  if (!sellerId) return true
  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, tenantId },
    select: { id: true },
  })
  return seller !== null
}

export async function validateBudgetInstaller(tenantId: string, installerId: string | null) {
  if (!installerId) return true
  const installer = await prisma.installer.findFirst({
    where: { id: installerId, tenantId },
    select: { id: true },
  })
  return installer !== null
}

export async function loadBudgetProducts(tenantId: string, productIds: string[]) {
  if (productIds.length === 0) {
    return []
  }

  return prisma.productService.findMany({
    where: { id: { in: productIds }, tenantId, active: true },
    select: { id: true, name: true, stock: true },
  })
}

export function findMissingProductIds(products: Array<{ id: string }>, productIds: string[]) {
  const found = new Set(products.map((product) => product.id))
  return productIds.filter((id) => !found.has(id))
}

export function buildStockProblems(
  products: Array<{ id: string; name: string; stock?: number | null }>,
  groupedQuantities: Map<string, number>
) {
  return products
    .map((product) => {
      const requested = groupedQuantities.get(product.id) ?? 0
      const available = product.stock ?? 0
      const missing = Math.max(0, requested - available)

      return {
        productServiceId: product.id,
        name: product.name,
        requested,
        available,
        missing,
      }
    })
    .filter((problem) => problem.missing > 0)
}

export function hasBudgetItemsUpdate(data: any): data is { items: unknown[] } {
  return Array.isArray(data?.items)
}

export function buildBudgetItemCreatePayload(items: NormalizedBudgetItem[]) {
  return items.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    discount: item.discount,
    productServiceId: item.productServiceId,
  }))
}

export const VALID_BUDGET_STATUSES = ['draft', 'sent', 'approved', 'rejected', 'completed', 'expired'] as const
export const LEGACY_BUDGET_STATUSES = ['expired'] as const
export const ALL_BUDGET_STATUSES = [...VALID_BUDGET_STATUSES, ...LEGACY_BUDGET_STATUSES] as const

export type ValidBudgetStatus = (typeof VALID_BUDGET_STATUSES)[number]
export type BudgetStatusValue = (typeof ALL_BUDGET_STATUSES)[number]

export function isValidBudgetStatus(
  status: unknown
): status is BudgetStatusValue {
  return (
    typeof status === 'string' &&
    (ALL_BUDGET_STATUSES as readonly string[])
      .includes(status)
  )
}

export function parseBudgetStatus(value: unknown): ValidBudgetStatus | null {
  return isValidBudgetStatus(value) ? value : null
}

export function isLegacyBudgetStatus(
  status: unknown
): status is (typeof LEGACY_BUDGET_STATUSES)[number] {
  return typeof status === 'string' && (LEGACY_BUDGET_STATUSES as readonly string[]).includes(status)
}

const budgetStatusTransitions: Record<string, readonly string[]> = {
  draft: ['sent', 'approved', 'rejected'],
  sent: ['draft', 'approved', 'rejected'],
  approved: ['completed', 'rejected'],
  rejected: ['draft', 'sent'],
  completed: [],
  expired: ['draft', 'sent'],
}

export function isAllowedBudgetStatusTransition(current: string, next: string) {
  return budgetStatusTransitions[current]?.includes(next) ?? false
}

export function getAllowedBudgetStatusTransitions(current: string) {
  return budgetStatusTransitions[current] ?? []
}
