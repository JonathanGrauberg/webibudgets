import { PageAccessGuard } from '@/components/page-access-guard'

export default function CompanySettingsLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="settings_company">{children}</PageAccessGuard>
}
