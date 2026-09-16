//app\api\dashboard\route.ts
import { NextResponse } from 'next/server'
import {
  getDashboardStats,
  getCollectedStats, // 👈 nuevo
  getRecentBudgets,
  getMonthlyRevenue,
  getBudgetStatusStats,
  getTopRequestedProducts, // 👈 nuevo
  getTopClients,
  getCobrosGastosSummary, // 👈 nuevo
  getDailyCashflow, // 👈 nuevo
} from '@/lib/dashboard-store'
import { getTenantIdFromRequest } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantIdFromRequest(request)

    // 👇 nuevo — parseo de rango desde query params
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const range = fromParam && toParam
      ? { from: new Date(fromParam), to: new Date(toParam) }
      : undefined

    const stats = await getDashboardStats(tenantId, range) // 👈 range agregado
    const collectedStats = await getCollectedStats(tenantId, range) // 👈 "Cobrado" respeta el rango, "Por Cobrar" no (ver comentario en dashboard-store.ts)
    const recentBudgets = await getRecentBudgets(tenantId, 5)
    const revenue = await getMonthlyRevenue(tenantId)
    const statusStats = await getBudgetStatusStats(tenantId)
    const topRequestedProducts = await getTopRequestedProducts(tenantId, 6)
    const topClients = await getTopClients(tenantId, 5)
    const cobrosGastos = await getCobrosGastosSummary(tenantId, range) // 👈 nuevo
    const dailyCashflow = await getDailyCashflow(tenantId) // 👈 nuevo — antes mensual, ahora por día

    return NextResponse.json({
      stats,
      collectedStats,
      recentBudgets,
      revenue,
      statusStats,
      topRequestedProducts,
      topClients,
      cobrosGastos,
      dailyCashflow,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}