import { PageAccessGuard } from '@/components/page-access-guard'

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="stock">{children}</PageAccessGuard>
}
