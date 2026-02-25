import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/lib/jwt.js';
import type { JwtPayload } from '@/lib/jwt.types.js';
import type { AuthUser } from '@/modules/auth/auth.types.js';
import { AuthErrorCode } from '@/modules/auth/auth.errors.js';


export function authenticate() {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: AuthErrorCode.UNAUTHORIZED });
    }

    try {
      const payload = verifyAccessToken(token) as JwtPayload;

      const user: AuthUser = {
        id: payload.sub,
        organizationId: payload.orgId,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
        sessionId: payload.sessionId,
      };

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: AuthErrorCode.INVALID_OR_EXPIRED_TOKEN });
    }
  };
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: AuthErrorCode.UNAUTHORIZED });
  }
  next();
}