// auth.types.ts
import type { UserRole, Role, RolePermission, Permission } from '@/generated/prisma/client';

export type RoleWithPermissions = Role & {
  RolePermission: (RolePermission & { Permission: Permission })[];
};

export type UserRoleWithRelations = UserRole & {
  Role?: RoleWithPermissions; // optional because it may not be included in queries
};

export type AuthUser = {
  id: string;
  organizationId: string;
  roles: UserRoleWithRelations[];
  permissions: string[]; // or PermissionKey[]
};
