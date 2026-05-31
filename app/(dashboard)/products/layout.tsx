import { PageAccessGuard } from '@/components/page-access-guard'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="products">{children}</PageAccessGuard>
}
