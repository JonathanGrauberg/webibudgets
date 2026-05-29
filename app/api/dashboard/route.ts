import { NextResponse } from 'next/server'
import {
  getDashboardStats,
  getRecentBudgets,
  getMonthlyRevenue,
  getBudgetStatusStats,
} from '@/lib/dashboard-store'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)
    const stats = await getDashboardStats(tenantId)
    const recentBudgets = await getRecentBudgets(tenantId, 5)
    const revenue = await getMonthlyRevenue(tenantId)
    const statusStats = await getBudgetStatusStats(tenantId)

    return NextResponse.json({
      stats,
      recentBudgets,
      revenue,
      statusStats,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}