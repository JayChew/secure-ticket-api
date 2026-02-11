import {
  AuthPolicyRule,
  hasRole,
  isAuthenticated,
} from "./auth.policy.base.js";
import { AuthPermission } from "../auth.permissions.js";

// sessionPolicies
export const sessionPolicies: AuthPolicyRule[] = [
  {
    permission: AuthPermission.AUTH_LOGOUT,
    allow: (ctx) => isAuthenticated(ctx),
  },
  {
    permission: AuthPermission.AUTH_REVOKE,
    allow: (ctx) => ctx.user?.isRevoked === false,
  },
];

// adminPolicies example
export const adminPolicies: AuthPolicyRule[] = [
  {
    permission: AuthPermission.MANAGE_USERS,
    allow: (ctx, role, targetUser) => {
      // role 类型缩小
      if (typeof role === "string") {
        return role === "admin";
      } else if (role) {
        return role.roleId === "admin";
      }

      // fallback: ctx.user.roles 检查
      return hasRole(ctx, "admin");
    },
  },
];
