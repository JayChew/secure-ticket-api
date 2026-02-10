import type { PermissionKey } from '@/docs/permissions.openapi.ts';

export interface JwtPayload {
  sub: string;            // user.id
  orgId: string;          // organizationId
  permissions: PermissionKey[];
}