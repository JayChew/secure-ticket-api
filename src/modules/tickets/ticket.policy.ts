import { HttpError } from "@/errors/http-error.js";
import { TicketErrorCode } from "./ticket.errors.js";
import { canTransition as isValidTransition } from "./ticket.state.js";
import type { Ticket, TicketStatus } from "@/generated/prisma/client";
import type { AuthUser } from "@/modules/auth/auth.types";
import { TicketPermissionMatrix, TicketAction } from "./ticket.permissions.js";

export class TicketPolicy {
  // =========================
  // Collection-level
  // =========================
  static forUser(user: AuthUser) {
    return new TicketPolicy(user);
  }

  // =========================
  // Instance-level
  // =========================
  static assert(user: AuthUser, ticket: Ticket) {
    return new TicketPolicy(user, ticket);
  }

  constructor(
    private user: AuthUser,
    private ticket?: Ticket,
  ) {}

  // =========================
  // LIST / COLLECTION POLICY
  // =========================
  buildListWhere(input: {
    organizationId: string;
    status?: TicketStatus;
    priority?: any;
    teamId?: string;
    assignedTo?: string;
  }) {
    const where: any = {
      organizationId: input.organizationId,
    };

    // 🔐 基于 permission / role 的可见性
    // Admin / ticket:any:view → 全组织
    if (this.user.permissions.includes("ticket:list:any")) {
      // no extra constraint
    }

    // ticket:own:view → 自己相关
    else if (this.user.permissions.includes("ticket:list:own")) {
      where.OR = [
        { createdById: this.user.id },
        { assignedToId: this.user.id },
      ];
    }

    // 没有 view 权限
    else {
      throw new HttpError(403, TicketErrorCode.FORBIDDEN);
    }

    // 🔍 Filters
    if (input.status) where.status = input.status;
    if (input.priority) where.priority = input.priority;
    if (input.teamId) where.teamId = input.teamId;
    if (input.assignedTo) where.assignedToId = input.assignedTo;

    return where;
  }

  // =========================
  // INSTANCE POLICY（你原来的）
  // =========================
  can(action: TicketAction) {
    if (!this.ticket) {
      throw new Error("TicketPolicy.can requires ticket");
    }

    const rule = TicketPermissionMatrix[action];

    if (rule.any && this.user.permissions.includes(rule.any)) return true;

    if (
      rule.own &&
      this.user.permissions.includes(rule.own) &&
      (this.ticket.createdById === this.user.id ||
        this.ticket.assignedToId === this.user.id)
    ) {
      return true;
    }

    throw new HttpError(403, TicketErrorCode.FORBIDDEN);
  }

  canTransition(nextStatus: TicketStatus) {
    if (!this.ticket) {
      throw new Error("TicketPolicy.canTransition requires ticket");
    }

    if (!isValidTransition(this.ticket.status, nextStatus)) {
      throw new HttpError(400, TicketErrorCode.INVALID_STATUS_TRANSITION);
    }

    if (
      nextStatus === "CLOSED" &&
      !this.user.permissions.includes(TicketPermissionMatrix.close.any)
    ) {
      throw new HttpError(403, TicketErrorCode.FORBIDDEN);
    }

    return true;
  }

  canUpdateField(field: keyof Pick<Ticket, "priority" | "assignedToId">) {
    import("./ticket.field-policy.js").then(({ canUpdateField }) =>
      canUpdateField(this.user, field),
    );
    return true;
  }
}
