import type { Prisma } from '@prisma/client'

export function splitFullName(fullName: string): { name: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { name: 'Usuario', lastName: '-' }
  if (parts.length === 1) return { name: parts[0], lastName: '-' }
  return { name: parts[0], lastName: parts.slice(1).join(' ') }
}

type LinkedProfileInput = {
  userId: string
  tenantId: string
  fullName: string
  email: string
  active?: boolean
}

export async function ensureSellerForUser(
  tx: Prisma.TransactionClient,
  input: LinkedProfileInput
) {
  const existing = await tx.seller.findFirst({
    where: { userId: input.userId, tenantId: input.tenantId },
  })
  if (existing) return existing

  const { name, lastName } = splitFullName(input.fullName)

  return tx.seller.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      name,
      lastName,
      email: input.email.trim(),
      active: input.active ?? true,
    },
  })
}

export async function ensureInstallerForUser(
  tx: Prisma.TransactionClient,
  input: LinkedProfileInput
) {
  const existing = await tx.installer.findFirst({
    where: { userId: input.userId, tenantId: input.tenantId },
  })
  if (existing) return existing

  const { name, lastName } = splitFullName(input.fullName)

  return tx.installer.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      name,
      lastName,
      email: input.email.trim(),
      phone: '-',
      active: input.active ?? true,
    },
  })
}
