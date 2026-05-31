import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessRoute, type RouteKey } from '@/lib/permissions'
import { AccessDenied } from '@/components/access-denied'

export async function PageAccessGuard({
  route,
  children,
}: {
  route: RouteKey
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role || !canAccessRoute(session.user.role, route)) {
    return <AccessDenied />
  }

  return <>{children}</>
}
