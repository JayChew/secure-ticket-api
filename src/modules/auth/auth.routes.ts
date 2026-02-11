import crypto from 'crypto';
import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { authenticate, requireAuth } from "@/middlewares/auth.middleware.js";
import { requireActiveOrganization } from "@/middlewares/org.guard.js";
import { requirePermission } from "@/middlewares/rbac.middleware.js";
import { AuthService } from "./auth.service.js";
import { AuthStore } from "./auth.store.js";
import { auditLog } from "@/lib/audit.js";
import type { AuthUser } from "@/modules/auth/auth.types.js";
import { HttpError } from "@/errors/http-error.js";
import { AuthErrorCode } from "./auth.errors.js";
import { issueAccessToken } from "@/lib/jwt.js";

const router = Router();

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

// -------------------------
// Create Session (Login)
// -------------------------
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const organizationId = (req.headers['x-organization-id'] as string) || req.body.organizationId;

  if (!organizationId) throw new HttpError(400, AuthErrorCode.ORGANIZATION_ID_REQUIRED);
  if (!email || !password) throw new HttpError(400, AuthErrorCode.INVALID_CREDENTIALS);

  // 1️⃣ 查找用户
  const userRecord = await AuthStore.findUserByEmail(organizationId, email);
  if (!userRecord) throw new HttpError(401, AuthErrorCode.INVALID_CREDENTIALS);

  // 2️⃣ 验证密码
  const passwordValid = await bcrypt.compare(password, userRecord.passwordHash);
  if (!passwordValid) throw new HttpError(401, AuthErrorCode.INVALID_CREDENTIALS);

  if (!userRecord.isActive) throw new HttpError(403, AuthErrorCode.USER_INACTIVE);

  // 3️⃣ 构建 AuthUser
  const authUser: AuthUser = {
    id: userRecord.id,
    roles: userRecord.UserRole,
    organizationId: userRecord.organizationId,
    permissions: AuthService.flattenPermissions(userRecord.UserRole),
  };

  // 4️⃣ 创建 session
  const refreshToken = generateRefreshToken();
  const session = await AuthService.createSession(authUser, {
    userId: authUser.id,
    refreshToken,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7天
  });

  // 5️⃣ 签发 access token
  const accessToken = issueAccessToken({
    sub: authUser.id,
    orgId: authUser.organizationId,
    roles: authUser.roles,
    permissions: authUser.permissions,
    sessionId: session.id,
  });

  // 6️⃣ 审计日志
  await auditLog({
    organizationId: authUser.organizationId,
    userId: authUser.id,
    action: 'auth.login',
    entityType: 'user',
    entityId: authUser.id,
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
  });

  // 7️⃣ 返回登录信息
  res.json({
    sessionId: session.id,
    accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    user: {
      id: authUser.id,
      email: userRecord.email,
      roles: authUser.roles,
      organizationId: authUser.organizationId,
    },
  });
});


// -------------------------
// Update User
// -------------------------
router.patch(
  "/users/:id",
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requirePermission("auth:user:update"),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: AuthService.flattenPermissions(user.roles),
      organizationId: user.organizationId,
      roles: user.roles,
    };

    const targetUserId = req.params.id as string;
    const targetUser = await AuthStore.findUserById(targetUserId);
    if (!targetUser) throw new HttpError(404, AuthErrorCode.USER_NOT_FOUND);

    const updateData: Record<string, any> = {};

    for (const field of ["passwordHash", "isActive", "teamId"] as const) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedUser = await AuthService.updateUser(
      authUser,
      targetUser,
      updateData,
    );

    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "auth.user.update",
      entityType: "user",
      entityId: targetUser.id,
      metadata: updateData,
    });

    res.json(updatedUser);
  },
);

// -------------------------
// Get User
// -------------------------
router.get(
  "/users/:id",
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id as string,
      permissions: AuthService.flattenPermissions(user.roles),
      organizationId: user.organizationId,
      roles: user.roles,
    };

    const targetUser = await AuthService.getUser(authUser.id);
    if (!targetUser) throw new HttpError(404, AuthErrorCode.USER_NOT_FOUND);

    res.json(targetUser);
  },
);

// -------------------------
// Revoke Session (Logout)
// -------------------------
router.delete(
  "/sessions/:id",
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requirePermission("auth:session:revoke"),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: AuthService.flattenPermissions(user.roles),
      organizationId: user.organizationId,
      roles: user.roles,
    };

    const sessionId = req.params.id as string;
    const session = await AuthStore.findSessionById(sessionId);
    if (!session || session.expiresAt < new Date())
      throw new HttpError(404, AuthErrorCode.SESSION_NOT_FOUND);

    await AuthService.revokeSession(authUser, sessionId);

    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "auth.session.revoke",
      entityType: "session",
      entityId: session.id,
    });

    res.json({ success: true });
  },
);

export default router;
