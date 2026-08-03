// app/verify/work-order/[id]/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { WorkOrderVerifyClient } from './work-order-verify-client'

export default async function VerifyWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/verify/work-order/${id}`)
  }

  const userTenantId = (session.user as any).tenantId

  // 👇 ahora solo pedimos lo mínimo para el gate — el resto lo trae el cliente vía /api/work-orders/[id]
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  })

  if (!workOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Orden de trabajo no encontrada.</p>
      </div>
    )
  }

  if (workOrder.tenantId !== userTenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-semibold text-destructive">Acceso denegado</p>
          <p className="text-sm text-muted-foreground">
            No pertenecés a la empresa dueña de esta orden de trabajo.
          </p>
        </div>
      </div>
    )
  }

  return <WorkOrderVerifyClient workOrderId={id} />
}