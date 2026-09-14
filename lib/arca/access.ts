//lib\arca\access.ts
//
// Chequeo server-side de que el tenant tiene el plan/feature habilitado
// para facturación electrónica — la UI ya lo bloquea, pero eso es solo
// cosmético si no se valida también acá. Todas las rutas de /api/arca/*
// deben llamar esto antes de hacer nada.
import { prisma } from '@/lib/prisma'
import { hasFeature } from '@/lib/features'

export async function tenantHasArcaFeature(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, features: true },
  })
  return hasFeature(tenant, 'arcaInvoicing')
}
