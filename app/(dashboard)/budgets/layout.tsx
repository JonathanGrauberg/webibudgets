import { PageAccessGuard } from '@/components/page-access-guard'

export default function BudgetsLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="budgets">{children}</PageAccessGuard>
}
