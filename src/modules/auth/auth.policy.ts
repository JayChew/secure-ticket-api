import type { AuthContext, UserRoleWithRelations } from "./auth.types.js";
import { ALL_POLICIES, normalizeRole } from "./policy/index.js";
import type { AuthPolicyRule } from "./policy/auth.policy.base.js";

/** 核心权限检查函数，支持可选 target 对象 */
export function can(
  ctx: AuthContext,
  permission: string,
  role?: string | UserRoleWithRelations,
  target?: any,
): boolean {
  const rule = ALL_POLICIES.find((p) => p.permission === permission);
  if (!rule) return false;

  const roleObj = role ? normalizeRole(role, ctx.user.id) : undefined;
  return rule.allow(ctx, roleObj, target);
}

/** 也可以直接导出辅助函数，例如 hasRole / isAuthenticated */
export * from "./policy/auth.policy.base.js";
