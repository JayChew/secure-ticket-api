import { AuthStore, SessionCreateData, UserUpdateData } from "./auth.store.js";
import { issueAccessToken } from "@/lib/jwt.js";
import { generateRefreshToken, hashToken } from "./auth.tokens.js";
import type {
  AuthUser,
  UserRoleWithRelations,
  AuthContext,
} from "./auth.types.js";
import { AuthPermission } from "./auth.permissions.js";
import { can } from "./policy/index.js";
import { HttpError } from "@/errors/http-error.js";
import { AuthState } from "./auth.state.js";
import { PermissionKey } from "@/docs/permissions.openapi.js";
import { AuthErrorCode } from "./auth.errors.js";

export const AuthService = {
  // -----------------------
  // Login / Create session
  // -----------------------
  async login(user: AuthUser, meta: SessionCreateData) {
    // 创建 session
    const session = await this.createSession(user, meta);

    // 签发 access token
    const accessToken = issueAccessToken({
      sub: user.id,
      orgId: user.organizationId,
      roles: user.roles,
      permissions: user.permissions,
      sessionId: session.id,
    });

    return {
      accessToken,
      session,
    };
  },

  // -----------------------
  // Refresh token rotation
  // -----------------------
  async refresh(params: { refreshToken: string }) {
    const { refreshToken } = params;

    if (!refreshToken) {
      throw new HttpError(401, AuthErrorCode.INVALID_REFRESH_REQUEST);
    }

    // ---------------------------
    // 1️⃣ 找 session，通过 refreshTokenHash
    // ---------------------------
    const incomingHash = hashToken(refreshToken);
console.log("incomingHash ################## ", incomingHash);
    const session = await AuthStore.findSessionByRefreshTokenHash(incomingHash);
    if (!session) throw new HttpError(401, AuthErrorCode.SESSION_NOT_FOUND);
    if (session.revokedAt) throw new HttpError(401, AuthErrorCode.SESSION_REVOKED);
    if (session.expiresAt < new Date()) throw new HttpError(401, AuthErrorCode.SESSION_EXPIRED);

    // ---------------------------
    // 2️⃣ token rotation
    // ---------------------------
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

    await AuthStore.rotateRefreshToken(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
    });

    // ---------------------------
    // 3️⃣ load user
    // ---------------------------
    const userRecord = await this.getUser(session.userId);
    if (!userRecord) throw new HttpError(401, AuthErrorCode.USER_NOT_FOUND);

    // ---------------------------
    // 4️⃣ 构建 AuthUser
    // ---------------------------
    const authUser: AuthUser = {
      id: userRecord.id,
      organizationId: userRecord.organizationId,
      roles: userRecord.UserRole,
      permissions: this.flattenPermissions(userRecord.UserRole),
    };

    // ---------------------------
    // 5️⃣ issue new access token
    // ---------------------------
    const accessToken = issueAccessToken({
      sub: authUser.id,
      orgId: authUser.organizationId,
      roles: authUser.roles,
      permissions: authUser.permissions,
      sessionId: session.id,
    });

    // ---------------------------
    // 6️⃣ return
    // ---------------------------
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      session: {
        id: session.id,
        expiresAt: newExpiresAt,
      },
      user: {
        id: authUser.id,
        organizationId: authUser.organizationId,
        roles: authUser.roles,
      },
    };
  },
  
  // -----------------------
  // Create session
  // -----------------------
  async createSession(user: AuthUser, data: SessionCreateData) {
    data.userId = user.id;
    return AuthStore.createSession(data);
  },

  // -----------------------
  // Find session
  // -----------------------
  async findSession(sessionId: string) {
    return AuthStore.findSessionById(sessionId);
  },

  // -----------------------
  // Update user
  // -----------------------
  async updateUser(user: AuthUser, targetUser: any, data: UserUpdateData) {
    const ctx: AuthContext = { user, state: AuthState.AUTHENTICATED };
    if (!can(ctx, AuthPermission.USER_UPDATE, targetUser))
      throw new HttpError(403, "No permission to update user");

    return AuthStore.updateUser(targetUser.id, data);
  },

  // -----------------------
  // Revoke session
  // -----------------------
  async revokeSession(user: AuthUser, sessionId: string) {
    const ctx: AuthContext = { user, state: AuthState.AUTHENTICATED };
    if (!can(ctx, AuthPermission.SESSION_REVOKE))
      throw new HttpError(403, "No permission to revoke session");

    return AuthStore.revokeSession(sessionId);
  },

  // -----------------------
  // Helpers
  // -----------------------
  flattenPermissions(roles: UserRoleWithRelations[]): PermissionKey[] {
    const set = new Set<PermissionKey>();
    for (const userRole of roles) {
      for (const rp of userRole.Role?.RolePermission ?? []) {
        set.add(rp.Permission.key as PermissionKey);
      }
    }
    return [...set];
  },

  async getUser(userId?: string, email?: string, organizationId?: string) {
    if (userId) return AuthStore.findUserById(userId);
    if (email && organizationId)
      return AuthStore.findUserByEmail(organizationId, email);
  },
};
