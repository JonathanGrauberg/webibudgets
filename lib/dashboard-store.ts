import { prisma } from '@/lib/prisma'

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

export async function getDashboardStats(): Promise<DashboardStats> {
  const totalClients = await prisma.client.count()
  const totalProducts = await prisma.productService.count({
    where: { active: true },
  })
  const totalBudgets = await prisma.budget.count()
  const approvedBudgets = await prisma.budget.count({
    where: { status: 'approved' },
  })
  const draftBudgets = await prisma.budget.count({
    where: { status: 'draft' },
  })
  const sentBudgets = await prisma.budget.count({
    where: { status: 'sent' },
  })
  const rejectedBudgets = await prisma.budget.count({
    where: { status: 'rejected' },
  })

  const approvedRevenue = await prisma.budget.aggregate({
    where: { status: 'approved' },
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

export async function getRecentBudgets(limit = 5): Promise<RecentBudget[]> {
  const budgets = await prisma.budget.findMany({
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

export async function getMonthlyRevenue() {
  const approved = await prisma.budget.findMany({
    where: { status: 'approved' },
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

export async function getBudgetStatusStats() {
  const grouped = await prisma.budget.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  return grouped.map((g) => ({
    status: g.status,
    count: g._count.status,
  }))
}