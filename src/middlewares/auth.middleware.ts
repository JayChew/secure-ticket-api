// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/lib/jwt.js';

export function authenticate() {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;

    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const token = auth.slice(7);

    try {
      const payload = verifyAccessToken(token);

      req.user = {
        id: payload.sub,
        organizationId: payload.orgId,
        permissions: payload.permissions,
      };

      next();
    } catch {
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  next();
}
