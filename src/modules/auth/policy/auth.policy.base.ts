import type { AuthContext, UserRoleWithRelations } from "../auth.types.js";
import { AuthPermission } from "../auth.permissions.js";
import { AuthState } from "../auth.state.js";
export type PolicyDecision = boolean;

export interface AuthPolicyRule {
  permission: AuthPermission;
  allow(
    ctx: AuthContext,
    role?: UserRoleWithRelations | string,
    target?: any,
  ): PolicyDecision;
}

/**
 * 公共工具函数
 */
export function isAuthenticated(ctx: AuthContext) {
  return ctx.state === AuthState.AUTHENTICATED;
}

export function isAnonymous(ctx: AuthContext) {
  return ctx.state === AuthState.ANONYMOUS;
}

export function hasRole(ctx: AuthContext, role: string) {
  return ctx.user?.roles?.some((r) => r.roleId === role);
}
