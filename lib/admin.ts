export const OWNER_ROLE = 'owner'

export function isOwnerRole(role?: string | null): boolean {
  return role === OWNER_ROLE
}
