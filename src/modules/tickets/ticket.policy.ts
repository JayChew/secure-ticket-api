import { HttpError } from "@/errors/http-error.js";
import { TicketErrorCode } from "./ticket.errors.js";
import { canTransition as isValidTransition } from "./ticket.state.js";
import type { Ticket, TicketStatus } from "@/generated/prisma/client";
import type { AuthUser } from "@/modules/auth/auth.types";
import { TicketPermissionMatrix, TicketAction } from "./ticket.permissions.js";

export class TicketPolicy {
  constructor(
    private user: AuthUser,
    private ticket: Ticket,
  ) {}

  static assert(user: AuthUser, ticket: Ticket) {
    return new TicketPolicy(user, ticket);
  }

  can(action: TicketAction) {
    const rule = TicketPermissionMatrix[action];

    // any 权限
    if (rule.any && this.user.permissions.includes(rule.any)) return true;

    // own 权限
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
    // 委托给 field-policy
    import("./ticket.field-policy.js").then(({ canUpdateField }) =>
      canUpdateField(this.user, field),
    );
    return true;
  }
}
