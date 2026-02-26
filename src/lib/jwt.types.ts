import type { PermissionKey } from "@/docs/permissions.openapi.ts";

export type JwtPayload = {
  sub: string; // userId
  orgId: string;
  permissions: PermissionKey[];
  iat?: number;
  exp?: number;
};
