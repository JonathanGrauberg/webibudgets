const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

function readEnv() {
  const p = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(p)) return {}
  return fs.readFileSync(p, 'utf8').split(/\r?\n/).reduce((acc, line) => {
    const m = line.match(/^([^=]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/)
    if (m) acc[m[1]] = m[2] ?? m[3] ?? m[4]
    return acc
  }, {})
}

;(async () => {
  const env = readEnv()
  console.log('DEFAULT_TENANT_ID (from .env):', env.DEFAULT_TENANT_ID)

  const prisma = new PrismaClient()
  try {
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, slug: true } })
    console.log('\nTenants:')
    console.table(tenants)

    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, tenantId: true, active: true } })
    console.log('\nUsers:')
    console.table(users)

    // find development tenant
    const dev = tenants.find(t => t.slug === 'development')
    if (!dev) {
      console.error('\nNo development tenant found')
      process.exit(1)
    }

    console.log('\nUsing development tenant id:', dev.id)
    console.log('Does DEFAULT_TENANT_ID === development id?', String(env.DEFAULT_TENANT_ID) === String(dev.id))

    // Update branding
    const logo = 'https://example.com/logo-dev.png'
    const favicon = 'https://example.com/favicon-dev.ico'

    console.log('\nUpdating tenant branding (logoUrl, faviconUrl)')
    await prisma.tenant.update({ where: { id: dev.id }, data: { logoUrl: logo, faviconUrl: favicon } })

    const refreshed = await prisma.tenant.findUnique({ where: { id: dev.id }, select: { id: true, logoUrl: true, faviconUrl: true } })
    console.log('\nTenant branding after update:')
    console.log(refreshed)

    await prisma.$disconnect()
  } catch (e) {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }
})()
