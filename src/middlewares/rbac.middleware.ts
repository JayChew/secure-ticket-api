import type { Request, Response, NextFunction } from "express";
import type { PermissionKey } from "@/docs/permissions.openapi.js";

type PermissionRequirement =
  | PermissionKey
  | PermissionKey[]
  | {
      anyOf?: PermissionKey[];
      allOf?: PermissionKey[];
    };

export function requirePermission(requirement: PermissionRequirement) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const userPerms = user.permissions as PermissionKey[];

    let allowed = false;
    let missing: PermissionKey[] = [];

    // 1️⃣ 简写：单个 permission
    if (typeof requirement === "string") {
      allowed = userPerms.includes(requirement);
      if (!allowed) missing = [requirement];
    }

    // 2️⃣ 简写：数组 = anyOf（保持你现在的行为）
    else if (Array.isArray(requirement)) {
      allowed = requirement.some((p) => userPerms.includes(p));
      if (!allowed) missing = requirement;
    }

    // 3️⃣ 明确表达式（为未来准备）
    else {
      const { anyOf, allOf } = requirement;

      if (anyOf) {
        allowed = anyOf.some((p) => userPerms.includes(p));
        if (!allowed) missing.push(...anyOf);
      }

      if (allOf) {
        const missingAll = allOf.filter(
          (p) => !userPerms.includes(p),
        );
        if (missingAll.length > 0) {
          allowed = false;
          missing.push(...missingAll);
        } else {
          allowed = true;
        }
      }
    }

    if (!allowed) {
      return res.status(403).json({
        error: "FORBIDDEN",
        required: requirement,
        userPermissions: userPerms,
        missing,
      });
    }

    next();
  };
}
