import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Default Tenant',
      slug: 'default',
    },
  })

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@local.test'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password'
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'admin@webibudgets.local'
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'Admin123*'

  const adminHashed = await bcrypt.hash(adminPassword, 10)
  const ownerHashed = await bcrypt.hash(ownerPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'admin',
      tenantId: tenant.id,
      password: adminHashed,
    },
    create: {
      name: 'Admin',
      email: adminEmail,
      password: adminHashed,
      role: 'admin',
      tenantId: tenant.id,
    },
  })

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      role: 'owner',
      tenantId: tenant.id,
      password: ownerHashed,
      name: 'Webi Studio',
    },
    create: {
      name: 'Webi Studio',
      email: ownerEmail,
      password: ownerHashed,
      role: 'owner',
      tenantId: tenant.id,
    },
  })

  console.log('Seed completed: tenant', tenant.id)
  console.log('Owner seeded:', ownerEmail)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
