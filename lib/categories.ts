import { prisma } from '@/lib/prisma'

export async function resolveCustomCategoryId(customCategoryId: unknown, tenantId: string) {
  if (typeof customCategoryId !== 'string' || !customCategoryId) return null
  const cat = await prisma.tenantProductCategory.findFirst({
    where: { id: customCategoryId, tenantId },
    select: { id: true },
  })
  return cat?.id ?? null
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}