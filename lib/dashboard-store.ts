//lib\dashboard-store.ts
import { prisma } from '@/lib/prisma'
import type { ProductCategory, BudgetStatus } from '@prisma/client' // 👈 nuevo
import { getCollectedByBudgetIds } from '@/lib/collected-amount'

// Estados de presupuesto donde tiene sentido esperar un cobro — un 'draft'
// o 'rejected' nunca va a tener plata entrando.
const PAYABLE_STATUSES: BudgetStatus[] = ['sent', 'approved', 'completed']

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

export async function getDashboardStats(
  tenantId: string,
  range?: { from: Date; to: Date } // 👈 nuevo, opcional
): Promise<DashboardStats> {
  const dateFilter = range ? { createdAt: { gte: range.from, lte: range.to } } : {}

  const totalClients = await prisma.client.count({ where: { tenantId } }) // 👈 sin filtro, a propósito
  const totalProducts = await prisma.productService.count({
    where: { tenantId, active: true },
  }) // 👈 sin filtro, a propósito

  const totalBudgets = await prisma.budget.count({ where: { tenantId, ...dateFilter } })
  const approvedBudgets = await prisma.budget.count({
    where: { tenantId, status: 'approved', ...dateFilter },
  })
  const draftBudgets = await prisma.budget.count({
    where: { tenantId, status: 'draft', ...dateFilter },
  })
  const sentBudgets = await prisma.budget.count({
    where: { tenantId, status: 'sent', ...dateFilter },
  })
  const rejectedBudgets = await prisma.budget.count({
    where: { tenantId, status: 'rejected', ...dateFilter },
  })

  const approvedRevenue = await prisma.budget.aggregate({
    where: { tenantId, status: 'approved', ...dateFilter },
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

export interface CollectedStats {
  totalCollected: number      // plata que entró de verdad (recibos + MP)
  totalPending: number        // lo que falta cobrar de lo ya aprobado/enviado
  totalApprovedValue: number  // "si se cobrara todo" — el número viejo, ahora secundario
}

// 👇 nuevo — a diferencia de totalRevenue (arriba), esto SÍ resta lo que ya
// se cobró. totalRevenue mezclaba "lo que valen los presupuestos aprobados"
// con "lo que entró de verdad", que dejaron de ser lo mismo apenas existió
// el cobro parcial online.
export async function getCollectedStats(tenantId: string): Promise<CollectedStats> {
  const budgets = await prisma.budget.findMany({
    where: { tenantId, status: { in: PAYABLE_STATUSES } },
    select: { id: true, total: true },
  })

  const collectedByBudget = await getCollectedByBudgetIds(budgets.map((b) => b.id))

  let totalCollected = 0
  let totalApprovedValue = 0
  for (const b of budgets) {
    totalApprovedValue += b.total
    // Math.min por las dudas — si alguien pagó de más por error, no
    // queremos mostrar "cobrado" mayor a lo presupuestado.
    totalCollected += Math.min(collectedByBudget.get(b.id) ?? 0, b.total)
  }

  return {
    totalCollected,
    totalApprovedValue,
    totalPending: Math.max(totalApprovedValue - totalCollected, 0),
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

export interface TopClient {
  clientId: string
  name: string
  company: string | null
  totalRevenue: number // suma de total en presupuestos Aprobados + Completados
  budgetCount: number
}

// "Mejor cliente" = el que más facturación generó en presupuestos ya
// cerrados (Aprobados + Completados) — mismo criterio que el filtro por
// defecto de la página de Presupuestos, no cantidad de presupuestos.
export async function getTopClients(tenantId: string, limit = 5): Promise<TopClient[]> {
  const grouped = await prisma.budget.groupBy({
    by: ['clientId'],
    where: { tenantId, status: { in: ['approved', 'completed'] } },
    _sum: { total: true },
    _count: { clientId: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limit,
  })

  const clientIds = grouped.map((g) => g.clientId)
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true, company: true },
  })
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  return grouped
    .map((g) => {
      const client = clientMap.get(g.clientId)
      if (!client) return null
      return {
        clientId: client.id,
        name: client.name,
        company: client.company,
        totalRevenue: g._sum.total ?? 0,
        budgetCount: g._count.clientId,
      }
    })
    .filter((x): x is TopClient => x !== null)
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