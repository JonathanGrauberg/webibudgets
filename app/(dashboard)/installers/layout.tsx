import { PageAccessGuard } from '@/components/page-access-guard'

export default function InstallersLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="installers">{children}</PageAccessGuard>
}
