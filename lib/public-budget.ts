//lib\public-budget.ts
//
// Carga compartida por las 3 rutas públicas de /api/public/budgets/[token]/*
// (info, pay, status) — un solo lugar que define qué datos del presupuesto
// y del tenant se exponen sin login.
import { prisma } from '@/lib/prisma'

export async function loadPublicBudget(token: string) {
  return prisma.budget.findUnique({
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
          phone: true,
          email: true,
          website: true,
          showFooterBranding: true,
        },
      },
      items: { include: { productService: { select: { name: true } } } },
      payments: { select: { amount: true, status: true } },
    },
  })
}

export type PublicBudget = NonNullable<Awaited<ReturnType<typeof loadPublicBudget>>>
