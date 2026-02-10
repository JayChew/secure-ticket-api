import { Router, Request, Response } from 'express';
import { authenticate, requireAuth } from '@/middlewares/auth.middleware.js';
import { requireActiveOrganization, requireActiveSubscription } from '@/middlewares/org.guard.js';
import { requirePermission } from '@/middlewares/rbac.middleware.js';
import { canUpdateField } from './ticket.field-policy.js';
import { TicketService } from './ticket.service.js';
import { TicketStore } from './ticket.store.js';
import { auditLog } from '@/lib/audit.js';
import type { PermissionKey } from '@/docs/permissions.openapi.js';
import type { AuthUser } from './ticket.policy.js';

const router = Router();

// -------------------------
// Create Ticket
// -------------------------
router.post(
  '/',
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requireActiveSubscription,
  requirePermission('ticket:create'),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: user.permissions as PermissionKey[],
      organizationId: user.organizationId,
    };
    const { title, description, teamId, priority, assignedToId, status } = req.body;

    const ticket = await TicketService.create(authUser, {
      title,
      description,
      organizationId: user.organizationId,
      teamId: teamId || null,
      createdById: user.id,
      priority: priority || 'MEDIUM',
      assignedToId: assignedToId || null,
      status: status || 'OPEN',
    });

    // 更新配额
    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'ticket.create',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: { teamId },
    });

    res.json(ticket);
  }
);

// -------------------------
// Update Ticket
// -------------------------
router.patch(
  '/:id',
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requireActiveSubscription,
  requirePermission('ticket:update'),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const authUser: AuthUser = {
      id: user.id,
      permissions: user.permissions as PermissionKey[],
      organizationId: user.organizationId,
    };
    const ticketId = req.params.id as string;

    const ticket = await TicketStore.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'TICKET_NOT_FOUND' });

    const updateData: Record<string, any> = {};

    // 字段更新
    for (const field of ['priority', 'assignedToId'] as const) {
      if (req.body[field] !== undefined) {
        if (!canUpdateField(authUser, field)) {
          return res.status(403).json({ error: `FORBIDDEN_FIELD_${field.toUpperCase()}` });
        }
        updateData[field] = req.body[field];
      }
    }

    // 状态更新
    if (req.body.status) {
      updateData.status = req.body.status;
    }

    const updatedTicket = await TicketService.update(authUser, ticket, updateData);

    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'ticket.update',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: updateData,
    });

    res.json(updatedTicket);
  }
);

// -------------------------
// Get Ticket
// -------------------------
router.get(
  '/:id',
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
    const ticketId = req.params.id as string;

    const ticket = await TicketStore.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'TICKET_NOT_FOUND' });

    const result = await TicketService.get(authUser, ticket);

    res.json(result);
  }
);

export default router;