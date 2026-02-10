import type { PermissionKey } from '@/docs/permissions.openapi.ts';

declare global {
  namespace Express {
    interface User {
      id: string;
      permissions: PermissionKey[];
      organizationId: string;
    }

    interface Request {
      user?: User;
      subscriptionId?: string;
    }
  }
}

export {};
