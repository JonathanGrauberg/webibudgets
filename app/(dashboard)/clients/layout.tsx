import { PageAccessGuard } from '@/components/page-access-guard'

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="clients">{children}</PageAccessGuard>
}
