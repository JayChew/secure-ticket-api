import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { authenticate, requireAuth } from "@/middlewares/auth.middleware.js";
import { requireActiveOrganization } from "@/middlewares/org.guard.js";
import { requirePermission } from "@/middlewares/rbac.middleware.js";
import { generateRefreshToken, hashToken } from "./auth.tokens.js";
import { AuthService } from "./auth.service.js";
import { AuthStore } from "./auth.store.js";
import { auditLog } from "@/lib/audit.js";
import type { AuthUser } from "./auth.types.js";
import { HttpError } from "@/errors/http-error.js";
import { AuthErrorCode } from "./auth.errors.js";
import { issueAccessToken } from "@/lib/jwt.js";

const router = Router();

// -------------------------
// Refresh
// -------------------------
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { sessionId, refreshToken } = req.body;
    if (!sessionId || !refreshToken) {
      throw new HttpError(400, AuthErrorCode.INVALID_REFRESH_REQUEST);
    }

    const result = await AuthService.refresh({ sessionId, refreshToken });
    res.json(result);
  } catch (err) {
    if (err instanceof HttpError)
      res.status(err.status).json({ error: err.message });
    else res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------
// Login
// -------------------------
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const organizationId =
      (req.headers["x-organization-id"] as string) || req.body.organizationId;
    if (!organizationId)
      throw new HttpError(400, AuthErrorCode.ORGANIZATION_ID_REQUIRED);
    if (!email || !password)
      throw new HttpError(400, AuthErrorCode.INVALID_CREDENTIALS);

    const userRecord = await AuthService.getUser(
      undefined,
      email,
      organizationId,
    );
    if (!userRecord)
      throw new HttpError(401, AuthErrorCode.INVALID_CREDENTIALS);

    const passwordValid = await bcrypt.compare(
      password,
      userRecord.passwordHash,
    );
    if (!passwordValid)
      throw new HttpError(401, AuthErrorCode.INVALID_CREDENTIALS);
    if (!userRecord.isActive)
      throw new HttpError(403, AuthErrorCode.USER_INACTIVE);

    const authUser: AuthUser = {
      id: userRecord.id,
      roles: userRecord.UserRole,
      organizationId: userRecord.organizationId,
      permissions: AuthService.flattenPermissions(userRecord.UserRole),
    };

    const refreshToken = generateRefreshToken();
    const session = await AuthService.createSession(authUser, {
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });

    const accessToken = issueAccessToken({
      sub: authUser.id,
      orgId: authUser.organizationId,
      roles: authUser.roles,
      permissions: authUser.permissions,
      sessionId: session.id,
    });

    // 审计日志
    await auditLog({
      organizationId: authUser.organizationId,
      userId: authUser.id,
      action: "auth.login",
      entityType: "user",
      entityId: authUser.id,
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] },
    });

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        sessionId: session.id,
        accessToken,
        expiresAt: session.expiresAt,
        user: {
          id: authUser.id,
          email: userRecord.email,
          roles: authUser.roles,
          organizationId: authUser.organizationId,
        },
      });
  } catch (err) {
    if (err instanceof HttpError)
      res.status(err.status).json({ error: err.message });
    else res.status(500).json({ error: "Internal server error" });
  }
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
    const targetUser = await AuthService.getUser(targetUserId);
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
    const session = await AuthService.findSession(sessionId);
    if (!session) throw new HttpError(404, AuthErrorCode.SESSION_NOT_FOUND);

    if (session.expiresAt < new Date())
      throw new HttpError(401, AuthErrorCode.SESSION_EXPIRED);

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
