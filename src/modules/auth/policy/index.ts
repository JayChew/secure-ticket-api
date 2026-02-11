import type { AuthContext, UserRoleWithRelations } from "../auth.types.js";
import type { AuthPolicyRule } from "./auth.policy.base.js";

import { loginPolicies } from "./auth.policy.login.js";
import { sessionPolicies } from "./auth.policy.session.js";
import { profilePolicies } from "./auth.policy.profile.js";
import { adminPolicies } from "./auth.policy.admin.js";

// 合并所有策略
export const ALL_POLICIES: AuthPolicyRule[] = [
  ...loginPolicies,
  ...sessionPolicies,
  ...profilePolicies,
  ...adminPolicies,
];

/** Normalize role string -> UserRoleWithRelations */
export function normalizeRole(
  role: string | UserRoleWithRelations,
  userId: string,
): UserRoleWithRelations {
  if (typeof role === "string") {
    return { userId, roleId: role, Role: undefined };
  }
  return role;
}
