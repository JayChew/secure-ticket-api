import { Router, Request, Response } from "express";
import { authenticate, requireAuth } from "@/middlewares/auth.middleware.js";
import {
  requireActiveOrganization,
  requireActiveSubscription,
} from "@/middlewares/org.guard.js";
import { requirePermission } from "@/middlewares/rbac.middleware.js";
import { TicketService } from "./ticket.service.js";
import { TicketStateMachineService } from "./ticket.state-machine.js";
import { TicketStore } from "./ticket.store.js";
import { auditLog } from "@/lib/audit.js";

const router = Router();

// -------------------------
// Create Ticket
// -------------------------
router.post(
  "/",
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requireActiveSubscription,
  requirePermission("ticket:create"),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { title, description, teamId } = req.body;

    const ticket = await TicketService.create(user, {
      title,
      description,
      teamId,
    });

    // 更新 quota
    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "ticket.create",
      entityType: "ticket",
      entityId: ticket.id,
      metadata: { teamId },
    });

    res.json(ticket);
  },
);

// -------------------------
// Update Ticket
// -------------------------
router.patch(
  "/:id",
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  requireActiveSubscription,
  requirePermission("ticket:update"),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const ticketId = req.params.id as string;

    const ticket = await TicketStore.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: "TICKET_NOT_FOUND" });

    // 字段 & 状态更新
    const updateData: Record<string, any> = {};
    if (req.body.priority) updateData.priority = req.body.priority;
    if (req.body.assignedToId) updateData.assignedToId = req.body.assignedToId;
    if (req.body.status) {
      // 调用状态机 service 统一校验 + 更新
      const updatedTicket = await TicketStateMachineService.transition(
        user,
        ticket,
        req.body.status,
      );
      Object.assign(updateData, { status: updatedTicket.status });
    }

    // 其余字段通过 TicketService.update 校验
    const updatedTicket = await TicketService.update(user, ticket, updateData);

    await auditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "ticket.update",
      entityType: "ticket",
      entityId: ticketId,
      metadata: updateData,
    });

    res.json(updatedTicket);
  },
);

// -------------------------
// Get Ticket
// -------------------------
router.get(
  "/:id",
  authenticate(),
  requireAuth,
  requireActiveOrganization,
  async (req: Request, res: Response) => {
    const user = req.user!;
    const ticketId = req.params.id as string;

    const ticket = await TicketStore.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: "TICKET_NOT_FOUND" });

    await TicketService.get(user, ticket); // RBAC check

    res.json(ticket);
  },
);

export default router;
