import type { PermissionKey } from "@/docs/permissions.openapi.js";
import type { UserRoleWithRelations } from "@/modules/auth/auth.types.js";

export type JwtPayload = {
  sub: string; // userId
  orgId: string;
  permissions: PermissionKey[];

  roles?: UserRoleWithRelations[];

  sessionId?: string;

  iat?: number;
  exp?: number;
};
