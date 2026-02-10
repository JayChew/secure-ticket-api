import type { PermissionKey } from '@/docs/permissions.openapi.js';
import type { AuthUser } from '@/modules/auth/auth.types.js';

export function extractPermissions(user: AuthUser): PermissionKey[] {
  const permissions = new Set<PermissionKey>();

  for (const ur of user.roles) {
    const role = ur.Role;
    if (!role || !role.RolePermission) continue;

    for (const rp of role.RolePermission) {
      const perm = rp.Permission;
      if (!perm) continue;

      permissions.add(`${perm.action}:${perm.resource}` as PermissionKey);
    }
  }

  return [...permissions];
}
