import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { authenticate, requireAuth } from "@/middlewares/auth.middleware.js";
import { requireActiveOrganization } from "@/middlewares/org.guard.js";
import { requirePermission } from "@/middlewares/rbac.middleware.js";
import { generateRefreshToken, hashToken } from "./auth.tokens.js";
import { AuthService } from "./auth.service.js";
import { auditLog } from "@/lib/audit.js";
import type { AuthUser } from "./auth.types.js";
import { HttpError } from "@/errors/http-error.js";
import { AuthErrorCode } from "./auth.errors.js";
import type { CookieOptions } from "express";

const router = Router();

const isProd = process.env.NODE_ENV === "production";

/**
 * AccessToken Cookie 配置
 */
export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,                 // 始终 true，安全
  sameSite: isProd ? 'none' : 'lax', // 本地开发用 'lax'，生产跨域用 'none'
  secure: isProd,                 // 本地开发 false，生产 true
  maxAge: 15 * 60 * 1000,         // 15 分钟
  path: '/',
};

/**
 * RefreshToken Cookie 配置
 */
export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
  path: '/auth/refresh',
};

// -------------------------
// Refresh
// -------------------------
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const clientType = (req.headers["x-client-type"] as string) || "web";
    let refreshToken: string | undefined;

    if (clientType === "web") {
      refreshToken = req.cookies?.refreshToken;
    } else {
      const authHeader = req.headers.authorization;
      refreshToken = authHeader?.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : req.body.refreshToken;
    }

    if (!refreshToken) return res.status(401).json({ error: "Missing refreshToken" });

    const { accessToken, refreshToken: newRefreshToken, session, user } =
      await AuthService.refresh({ refreshToken });

    if (clientType === "web") {
      // res
      //   .cookie("accessToken", encodeURIComponent(accessToken), accessTokenCookieOptions)
      //   .cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions)
      //   .json({ user, session });
      res.cookie("accessToken", encodeURIComponent(accessToken), accessTokenCookieOptions)
      res.cookie("refreshToken", newRefreshToken, refreshTokenCookieOptions)
      res.json({ user, session });
    } else {
      res.json({ user, session, tokens: { accessToken, refreshToken: newRefreshToken } });
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// -------------------------
// Login (Web + Mobile)
// -------------------------
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const organizationId =
      (req.headers["x-organization-id"] as string) || req.body.organizationId;
    const clientType = (req.headers["x-client-type"] as string) || "web"; // 默认 web

    if (!organizationId)
      throw new HttpError(400, AuthErrorCode.ORGANIZATION_ID_REQUIRED);
    if (!email || !password)
      throw new HttpError(400, AuthErrorCode.INVALID_CREDENTIALS);

    const userRecord = await AuthService.getUser(undefined, email, organizationId);
    if (!userRecord)
      throw new HttpError(401, AuthErrorCode.INVALID_CREDENTIALS);

    const passwordValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!passwordValid)
      throw new HttpError(401, AuthErrorCode.INVALID_CREDENTIALS);
    if (!userRecord.isActive)
      throw new HttpError(403, AuthErrorCode.USER_INACTIVE);

    const authUser: AuthUser = {
      id: userRecord.id,
      organizationId: userRecord.organizationId,
      permissions: AuthService.flattenPermissions(userRecord.UserRole),
      roles: userRecord.UserRole,
    };

    // 生成 refreshToken
    const refreshToken = generateRefreshToken();
    const { accessToken, session } = await AuthService.login(authUser, {
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
      userId: authUser.id,
    })

    // 审计日志
    await auditLog({
      organizationId: authUser.organizationId,
      userId: authUser.id,
      action: "auth.login",
      entityType: "user",
      entityId: authUser.id,
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] },
    });

    // ---------------------------
    // 根据 clientType 处理返回
    // ---------------------------
    if (clientType === "web") {
      // Web 浏览器使用 HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
      res.cookie("accessToken", encodeURIComponent(accessToken), accessTokenCookieOptions)
      res.json({
          user: {
            id: authUser.id,
            email: userRecord.email,
            organizationId: authUser.organizationId,
            permissions: authUser.permissions,
            roles: authUser.roles,
          },
          session: {
            id: session.id,
            expiresAt: session.expiresAt,
          },
        });
    } else {
      // Mobile App 直接返回 token，由 App 存储
      res.json({
        user: {
          id: authUser.id,
          email: userRecord.email,
          organizationId: authUser.organizationId,
          permissions: authUser.permissions,
          roles: authUser.roles,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
    } else {
      res.status(500).json({ error: err });
    }
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
