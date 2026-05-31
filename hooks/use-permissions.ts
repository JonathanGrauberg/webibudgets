'use client'

import { useSession } from 'next-auth/react'
import {
  canAccessRoute,
  canEdit,
  canEditBudget,
  canViewBudgetStatus,
  filterBudgetsByRole,
  type EditScope,
  type RouteKey,
} from '@/lib/permissions'

export function usePermissions() {
  const { data: session, status } = useSession()
  const role = session?.user?.role
  const userId = session?.user?.id

  return {
    role,
    userId,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    canAccess: (route: RouteKey) => canAccessRoute(role, route),
    canEdit: (scope: EditScope) => canEdit(role, scope),
    canEditBudget: (budgetSellerId?: string | null) =>
      canEditBudget(role, userId, budgetSellerId),
    canChangeBudgetStatus: () => canEdit(role, 'budget_status'),
    canViewBudgetStatus: (budgetStatus: string) => canViewBudgetStatus(role, budgetStatus),
    filterBudgets: <T extends { status: string }>(budgets: T[]) =>
      filterBudgetsByRole(role, budgets),
  }
}
