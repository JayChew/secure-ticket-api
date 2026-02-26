import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/lib/jwt.js';
import { AuthErrorCode } from '@/modules/auth/auth.errors.js';


// -------------------------
// Authenticate Middleware
// -------------------------
export function authenticate() {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : cookieToken;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        organizationId: payload.orgId,
        permissions: payload.permissions ?? [],
      };
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
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