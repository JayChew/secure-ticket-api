import type {
  AuthUser,
  UserRoleWithRelations,
  AuthContext,
} from "./auth.types.js";
import { AuthStore, UserUpdateData, SessionCreateData } from "./auth.store.js";
import { issueAccessToken } from "@/lib/jwt.js";
import { HttpError } from "@/errors/http-error.js";
import { AuthPermission } from "./auth.permissions.js";
import { can } from "./auth.policy.js"; // <- 整合后的策略
import { AuthState } from "./auth.state.js";
import { PermissionKey } from "@/docs/permissions.openapi.js";

export const AuthService = {
  async login(user: AuthUser, meta: SessionCreateData) {
    const session = await this.createSession(user, meta);

    const accessToken = issueAccessToken({
      sub: user.id,
      orgId: user.organizationId,
      permissions: user.permissions,
      roles: user.roles,
      sessionId: session.id,
    });

    return { accessToken, session };
  },

  async createSession(user: AuthUser, data: SessionCreateData) {
    data.userId = user.id;
    return AuthStore.createSession(data);
  },

  async updateUser(user: AuthUser, targetUser: any, data: UserUpdateData) {
    const ctx: AuthContext = {
      user,
      state: AuthState.AUTHENTICATED,
    };
    if (!can(ctx, AuthPermission.USER_UPDATE, targetUser))
      throw new HttpError(403, "No permission to update user");

    return AuthStore.updateUser(targetUser.id, data);
  },

  flattenPermissions(roles: UserRoleWithRelations[]): PermissionKey[] {
    const set = new Set<PermissionKey>();
    for (const userRole of roles) {
      for (const rp of userRole.Role?.RolePermission ?? []) {
        set.add(rp.Permission.key as PermissionKey);
      }
    }
    return [...set];
  },

  async getUser(userId: string) {
    return AuthStore.findUserById(userId);
  },

  async revokeSession(user: AuthUser, sessionId: string) {
    const ctx: AuthContext = {
      user,
      state: AuthState.AUTHENTICATED,
    };
    if (!can(ctx, AuthPermission.SESSION_REVOKE))
      throw new HttpError(403, "No permission to revoke session");

    return AuthStore.revokeSession(sessionId);
  },
};
