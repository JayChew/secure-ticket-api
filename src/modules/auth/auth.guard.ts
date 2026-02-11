import type { User, Session } from "@/generated/prisma/client";
import type { AuthUser } from "./auth.types.js";
import { canUpdateField } from "./auth.field-policy.js";
import { AuthState } from "./auth.state.js";
import { can } from "./auth.policy.js";

/**
 * checkAuthAccess
 * 对应 checkTicketAccess
 */
export function checkAuthAccess(
  user: AuthUser,
  targetUser: User,
  action: "view" | "update" | "revoke",
  _session?: Session,
) {
  const ctx = { user, state: AuthState.AUTHENTICATED }; // 构造 AuthContext
  const permissionMap = {
    view: "USER_VIEW",
    update: "USER_UPDATE",
    revoke: "SESSION_REVOKE",
  };

  const permission = permissionMap[action];

  if (!can(ctx, permission, undefined, targetUser)) {
    throw new Error(`No permission to ${action}`);
  }
}

/**
 * checkUserFieldPermission
 * 对应 checkFieldPermission
 */
export function checkUserFieldPermission(
  user: AuthUser,
  field: "passwordHash" | "role",
) {
  canUpdateField(user, field);
}
