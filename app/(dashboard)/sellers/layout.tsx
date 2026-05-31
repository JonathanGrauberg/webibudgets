import { PageAccessGuard } from '@/components/page-access-guard'

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="sellers">{children}</PageAccessGuard>
}
