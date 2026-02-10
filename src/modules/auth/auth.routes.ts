import { Router, Request, Response } from 'express';
import { authenticate, requireAuth } from '@/middlewares/auth.middleware.js';
import { requireActiveOrganization } from '@/middlewares/org.guard.js';
import { requirePermission } from '@/middlewares/rbac.middleware.js';
import { AuthService } from './auth.service.js';
import { AuthStore } from './auth.store.js';
import { auditLog } from '@/lib/audit.js';
import type { PermissionKey } from '@/docs/permissions.openapi.js';
import type { AuthUser } from './auth.policy.js';

const router = Router();

// -------------------------
// Create Session (Login)
// -------------------------
router.post(
  '/sessions',
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requirePermission('auth:session:create'),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: user.permissions as PermissionKey[],
      organizationId: user.organizationId
    };

    const { refreshToken, ipAddress, userAgent, expiresAt } = req.body;

    const session = await AuthService.createSession(authUser, {
      userId: user.id,
      refreshToken,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt: new Date(expiresAt),
    });

    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'auth.session.create',
      entityType: 'session',
      entityId: session.id,
    });

    res.json(session);
  }
);

// -------------------------
// Update User
// -------------------------
router.patch(
  '/users/:id',
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requirePermission('auth:user:update'),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: user.permissions as PermissionKey[],
      organizationId: user.organizationId,
    };

    const targetUserId = req.params.id as string;
    const targetUser = await AuthStore.findUserById(targetUserId);
    if (!targetUser)
      return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const updateData: Record<string, any> = {};

    for (const field of ['passwordHash', 'isActive', 'teamId'] as const) {
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
      action: 'auth.user.update',
      entityType: 'user',
      entityId: targetUser.id,
      metadata: updateData,
    });

    res.json(updatedUser);
  }
);

// -------------------------
// Get User
// -------------------------
router.get(
  '/users/:id',
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: user.permissions as PermissionKey[],
      organizationId: user.organizationId,
    };

    const targetUserId = req.params.id as string;
    const targetUser = await AuthStore.findUserById(targetUserId);
    if (!targetUser)
      return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const result = await AuthService.getUser(authUser, targetUser);

    res.json(result);
  }
);

// -------------------------
// Revoke Session (Logout)
// -------------------------
router.delete(
  '/sessions/:id',
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requirePermission('auth:session:revoke'),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: user.permissions as PermissionKey[],
      organizationId: user.organizationId,
    };

    const sessionId = req.params.id as string;
    const session = await AuthStore.findSessionById(sessionId);
    if (!session)
      return res.status(404).json({ error: 'SESSION_NOT_FOUND' });

    await AuthService.revokeSession(authUser, sessionId);

    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'auth.session.revoke',
      entityType: 'session',
      entityId: session.id,
    });

    res.json({ success: true });
  }
);

export default router;
