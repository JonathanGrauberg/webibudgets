import { PageAccessGuard } from '@/components/page-access-guard'

export default function NewBudgetLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="budgets_new">{children}</PageAccessGuard>
}
