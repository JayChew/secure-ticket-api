import { AuthPolicyRule, isAnonymous } from "./auth.policy.base.js";
import { AuthPermission } from "../auth.permissions.js";

export const loginPolicies: AuthPolicyRule[] = [
  {
    permission: AuthPermission.AUTH_LOGIN,
    allow: (ctx) => isAnonymous(ctx),
  },
  {
    permission: AuthPermission.AUTH_REFRESH,
    allow: (ctx) => !!ctx.refreshToken,
  },
];
