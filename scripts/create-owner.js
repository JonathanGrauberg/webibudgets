const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

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

  const ownerEmail = process.env.OWNER_EMAIL || 'admin@webibudgets.local'
  const ownerPassword = process.env.OWNER_PASSWORD || 'Admin123*'
  const hashed = await bcrypt.hash(ownerPassword, 10)

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      role: 'owner',
      tenantId: tenant.id,
      password: hashed,
      name: 'Webi Studio',
    },
    create: {
      name: 'Webi Studio',
      email: ownerEmail,
      password: hashed,
      role: 'owner',
      tenantId: tenant.id,
    },
  })

  console.log('Owner user seeded:')
  console.log('  email:', owner.email)
  console.log('  role:', owner.role)
  console.log('  tenantId:', owner.tenantId)
  console.log('  default password:', ownerPassword)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
