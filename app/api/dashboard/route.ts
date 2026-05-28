import { NextResponse } from 'next/server'
import {
  getDashboardStats,
  getRecentBudgets,
  getMonthlyRevenue,
  getBudgetStatusStats,
} from '@/lib/dashboard-store'

export async function GET() {
  try {
    const stats = await getDashboardStats()
    const recentBudgets = await getRecentBudgets(5)
    const revenue = await getMonthlyRevenue()
    const statusStats = await getBudgetStatusStats()

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