import type { Request, Response, NextFunction } from "express";
import type { PermissionKey } from "@/docs/permissions.openapi.js";

export function requirePermission(permission: PermissionKey) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    if (!user.permissions.includes(permission)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        permission,
      });
    }

    next();
  };
}
