import type { Request, Response, NextFunction } from 'express';
import type { PermissionKey } from '@/docs/permissions.openapi.ts';

export function requirePermission(permission: PermissionKey) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Missing permission: ${permission}`,
      });
    }

    next();
  };
}

