import { PageAccessGuard } from '@/components/page-access-guard'

export default function TeamSettingsLayout({ children }: { children: React.ReactNode }) {
  return <PageAccessGuard route="settings_team">{children}</PageAccessGuard>
}
