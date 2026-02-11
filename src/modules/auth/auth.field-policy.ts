import type { AuthUser } from "./auth.types.js";

export function canUpdateField(user: AuthUser, field: "passwordHash" | "role") {
  if (field === "passwordHash") {
    return user.permissions.includes("auth:user:update");
  }

  if (field === "role") {
    return user.permissions.includes("auth:user:update");
  }

  return false;
}
