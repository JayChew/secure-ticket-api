import { AuthPermission } from "../auth.permissions.js";
import type { AuthPolicyRule } from "./auth.policy.base.js";
import type { UserRoleWithRelations } from "../auth.types.js";

export const adminPolicies: AuthPolicyRule[] = [
  {
    permission: AuthPermission.MANAGE_USERS,
    allow: (ctx, role?: UserRoleWithRelations) => {
      if (role) {
        // Check against provided role
        return role.Role?.name === "Admin";
      }

      // Default: check all user roles in context
      return ctx.user.roles.some((r) => r.Role?.name === "Admin");
    },
  },
];
