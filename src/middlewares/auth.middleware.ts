// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/lib/jwt.js";
import type { JwtPayload } from "@/lib/jwt.types.js";
import type { AuthUser } from "@/modules/auth/auth.types.js";

export function authenticate() {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const token = auth.slice(7);

    try {
      const payload = verifyAccessToken(token) as JwtPayload;

      const user: AuthUser = {
        id: payload.sub,
        organizationId: payload.orgId,
        permissions: payload.permissions,
        roles: payload.roles ?? [],
        sessionId: payload.sessionId,
      };

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  next();
}
