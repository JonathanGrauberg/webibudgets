//lib\tenant.ts
import { prisma } from '@/lib/prisma'

export const TENANT_HEADER = 'x-tenant-id'
export const DEFAULT_TENANT_ENV = 'DEFAULT_TENANT_ID'
const DEVELOPMENT_TENANT_SLUG = 'development'
const DEVELOPMENT_TENANT_NAME = 'Development Tenant'

async function ensureDevelopmentTenant() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEVELOPMENT_TENANT_SLUG },
    update: {
      name: DEVELOPMENT_TENANT_NAME,
      active: true,
    },
    create: {
      name: DEVELOPMENT_TENANT_NAME,
      slug: DEVELOPMENT_TENANT_SLUG,
      active: true,
    },
  })

  return tenant
}

async function validateTenantId(candidate?: string): Promise<string | null> {
  if (!candidate) return null

  const tenant = await prisma.tenant.findUnique({
    where: { id: candidate },
    select: { id: true },
  })

  return tenant?.id ?? null
}

export async function getTenantIdFromRequest(request: Request): Promise<string> {
  const headerTenantId = request.headers.get(TENANT_HEADER)
  const candidateTenantId = headerTenantId ?? process.env.DEFAULT_TENANT_ID

  if (candidateTenantId) {
    const validTenantId = await validateTenantId(candidateTenantId)

    if (validTenantId) {
      return validTenantId
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[tenant] tenant id '${candidateTenantId}' not found; falling back to development tenant.`
      )
      return (await ensureDevelopmentTenant()).id
    }

    throw new Error(
      `Tenant not found for id '${candidateTenantId}'. Set a valid ${TENANT_HEADER} header or ${DEFAULT_TENANT_ENV}.`
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[tenant] no tenant header or ${DEFAULT_TENANT_ENV} configured; using development tenant.`
    )
    return (await ensureDevelopmentTenant()).id
  }

  throw new Error(
    `Tenant ID is required. Set the ${TENANT_HEADER} request header or the ${DEFAULT_TENANT_ENV} environment variable.`
  )
}

export async function getTenantIdFromSession(
  session?: { tenantId?: string | null }
): Promise<string> {
  const candidateTenantId = session?.tenantId ?? process.env.DEFAULT_TENANT_ID

  if (candidateTenantId) {
    const validTenantId = await validateTenantId(candidateTenantId)

    if (validTenantId) {
      return validTenantId
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[tenant] session tenant id '${candidateTenantId}' not found; falling back to development tenant.`
      )
      return (await ensureDevelopmentTenant()).id
    }

    throw new Error(
      `Tenant not found for id '${candidateTenantId}'. Set a valid tenantId in session or ${DEFAULT_TENANT_ENV}.`
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[tenant] no tenant id in session and no ${DEFAULT_TENANT_ENV}; using development tenant.`
    )
    return (await ensureDevelopmentTenant()).id
  }

  throw new Error(
    `Tenant ID is required from session and ${DEFAULT_TENANT_ENV} is not set.`
  )
}

export async function resolveTenantId(context: {
  request?: Request
  session?: { tenantId?: string | null }
} = {}): Promise<string> {
  // Prefer an explicit session tenant when provided.
  if (context.session) {
    return getTenantIdFromSession(context.session)
  }

  if (context.request) {
    return getTenantIdFromRequest(context.request)
  }

  if (process.env.NODE_ENV !== 'production') {
    return (await ensureDevelopmentTenant()).id
  }

  throw new Error(
    `Tenant ID not available. Set ${TENANT_HEADER} header or ${DEFAULT_TENANT_ENV} env var.`
  )
}

export function tenantWhereId(id: string, tenantId: string) {
  return { id, tenantId }
}

export function tenantWhere(tenantId: string, where: Record<string, unknown> = {}) {
  return { ...where, tenantId }
}

export function tenantCreateData<T extends Record<string, unknown>>(data: T, tenantId: string) {
  return { ...data, tenantId }
}

export async function getTenantBranding(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      website: true,
      description: true,
      logoUrl: true,
      faviconUrl: true,
      watermarkUrl: true,
      sidebarIconUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      watermarkOpacity: true,
      showPageNumbers: true,
      showWebsiteInPdf: true,
      showFooterBranding: true,
    },
  })
}
