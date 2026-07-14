//lib\dashboard-store.ts
import { prisma } from '@/lib/prisma'
import type { ProductCategory } from '@prisma/client' // 👈 nuevo

export interface DashboardStats {
  totalClients: number
  totalProducts: number
  totalBudgets: number
  approvedBudgets: number
  pendingBudgets: number
  rejectedBudgets: number
  totalRevenue: number
}

export interface RecentBudget {
  id: string
  total: number
  status: string
  createdAt: Date
  client: {
    name: string | null
    company: string | null
  } | null
  items: {
    id: string
  }[]
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const totalClients = await prisma.client.count({ where: { tenantId } })
  const totalProducts = await prisma.productService.count({
    where: { tenantId, active: true },
  })
  const totalBudgets = await prisma.budget.count({ where: { tenantId } })
  const approvedBudgets = await prisma.budget.count({
    where: { tenantId, status: 'approved' },
  })
  const draftBudgets = await prisma.budget.count({
    where: { tenantId, status: 'draft' },
  })
  const sentBudgets = await prisma.budget.count({
    where: { tenantId, status: 'sent' },
  })
  const rejectedBudgets = await prisma.budget.count({
    where: { tenantId, status: 'rejected' },
  })

  const approvedRevenue = await prisma.budget.aggregate({
    where: { tenantId, status: 'approved' },
    _sum: { total: true },
  })

  return {
    totalClients,
    totalProducts,
    totalBudgets,
    approvedBudgets,
    pendingBudgets: draftBudgets + sentBudgets,
    rejectedBudgets,
    totalRevenue: approvedRevenue._sum.total || 0,
  }
}

export async function getRecentBudgets(
  tenantId: string,
  limit = 5
): Promise<RecentBudget[]> {
  const budgets = await prisma.budget.findMany({
    where: { tenantId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          name: true,
          company: true,
        },
      },
      items: {
        select: {
          id: true,
        },
      },
    },
  })

  return budgets.map((b) => ({
    id: b.id,
    total: b.total,
    status: b.status,
    createdAt: b.createdAt,
    client: b.client
      ? {
          name: b.client.name ?? null,
          company: b.client.company ?? null,
        }
      : null,
    items: b.items.map((item) => ({
      id: item.id,
    })),
  }))
}

export async function getMonthlyRevenue(tenantId: string) {
  const approved = await prisma.budget.findMany({
    where: { tenantId, status: 'approved' },
    select: {
      total: true,
      createdAt: true,
    },
  })

  const map = new Map<string, number>()

  approved.forEach((b) => {
    const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + b.total)
  })

  return Array.from(map.entries()).map(([month, total]) => ({
    month,
    total,
  }))
}

export interface BudgetStatusCount {
  status: string
  count: number
}

export async function getBudgetStatusStats(tenantId: string): Promise<BudgetStatusCount[]> {
  const grouped = await prisma.budget.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: { status: true },
  })

  return grouped.map((g) => ({
    status: g.status,
    count: g._count.status,
  }))
}

export interface TopRequestedProduct {
  productServiceId: string
  name: string
  unit: string
  category: ProductCategory // 👈 antes: string
  requestCount: number // en cuántos presupuestos distintos apareció
}

export async function getTopRequestedProducts(
  tenantId: string,
  limit = 6
): Promise<TopRequestedProduct[]> {
  const grouped = await prisma.budgetItem.groupBy({
    by: ['productServiceId'],
    where: {
      productServiceId: { not: null },
      budget: { tenantId },
    },
    _count: { productServiceId: true },
    orderBy: { _count: { productServiceId: 'desc' } },
    take: limit,
  })

  const productIds = grouped
    .map((g) => g.productServiceId)
    .filter((id): id is string => id !== null)

  const products = await prisma.productService.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unit: true, category: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return grouped
    .map((g) => {
      const product = g.productServiceId ? productMap.get(g.productServiceId) : undefined
      if (!product) return null
      return {
        productServiceId: product.id,
        name: product.name,
        unit: product.unit,
        category: product.category,
        requestCount: g._count.productServiceId,
      }
    })
    .filter((x): x is TopRequestedProduct => x !== null)
}