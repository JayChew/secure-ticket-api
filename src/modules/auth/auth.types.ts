import type { PermissionKey } from "@/docs/permissions.openapi.js";
import type {
  UserRole,
  Role,
  RolePermission,
  Permission,
} from "@/generated/prisma/client.js";
import { AuthState } from "./auth.state.js";

export type RoleWithPermissions = Role & {
  RolePermission: (RolePermission & {
    Permission: Permission;
  })[];
};

export type UserRoleWithRelations = UserRole & {
  Role?: RoleWithPermissions;
};

/**
 * Domain Auth User
 * - Policy / Guard / Service ONLY depend on this
 * - No Express, No Prisma logic here
 */
export type AuthUser = {
  id: string;
  organizationId: string;
  permissions: PermissionKey[];
  roles: UserRoleWithRelations[];
  sessionId?: string;
  isRevoked?: boolean;
};

export type AuthContext = {
  user: AuthUser;
  sessionId?: string;
  state: AuthState;
  refreshToken?: string;
};
