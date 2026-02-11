import { AuthPolicyRule, isAuthenticated } from "./auth.policy.base.js";
import { AuthPermission } from "../auth.permissions.js";

export const profilePolicies: AuthPolicyRule[] = [
  {
    permission: AuthPermission.AUTH_VIEW_PROFILE,
    allow: (ctx) => isAuthenticated(ctx),
  },
  {
    permission: AuthPermission.AUTH_UPDATE_PROFILE,
    allow: (ctx) => isAuthenticated(ctx),
  },
];
