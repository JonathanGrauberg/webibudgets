//lib\public-cobro.ts
//
// Carga compartida por las rutas públicas de /api/public/cobros/[token]/* —
// mismo criterio que lib/public-budget.ts: un solo lugar que define qué
// datos se exponen sin login.
import { prisma } from '@/lib/prisma'

export async function loadPublicCobro(token: string) {
  return prisma.cobro.findUnique({
    where: { publicToken: token },
    include: {
      client: { select: { name: true, company: true } },
      tenant: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
          plan: true,
          mpConnected: true,
          mpAccessToken: true,
          mpRefreshToken: true,
          mpTokenExpiresAt: true,
          showFooterBranding: true,
        },
      },
    },
  })
}
