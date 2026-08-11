export const OWNER_ROLE = 'owner'
//lib\admin.ts
export function isOwnerRole(role?: string | null): boolean {
  return role === OWNER_ROLE
}
