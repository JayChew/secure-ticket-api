import { HttpError } from '@/errors/http-error.js';
import { TicketErrorCode } from './ticket.errors.js';
import { canTransition as isValidTransition } from './ticket.state.js';
import type { Ticket, TicketStatus, User } from '@/generated/prisma/client';
import type { PermissionKey } from '@/docs/permissions.openapi.js';

export type TicketAction = 'view' | 'update' | 'close';

export type PermissionRule = {
  any: PermissionKey;
  own?: PermissionKey;
};

const TicketPermissionMatrix: Record<TicketAction, PermissionRule> = {
  view: { any: 'ticket:view:any', own: 'ticket:view:own' },
  update: { any: 'ticket:update', own: 'ticket:update' },
  close: { any: 'ticket:close' },
};

export type AuthUser = {
  id: string;
  permissions: PermissionKey[];
  organizationId: User["organizationId"];
};

export class TicketPolicy {
  constructor(private user: AuthUser, private ticket: Ticket) {}

  static assert(user: AuthUser, ticket: Ticket) {
    return new TicketPolicy(user, ticket);
  }

  can(action: TicketAction) {
    const rule = TicketPermissionMatrix[action];

    if (rule.any && this.user.permissions.includes(rule.any)) return true;

    if (
      rule.own &&
      this.user.permissions.includes(rule.own) &&
      (this.ticket.createdById === this.user.id ||
        this.ticket.assignedToId === this.user.id)
    )
      return true;

    throw new HttpError(403, TicketErrorCode.FORBIDDEN);
  }

  canTransition(nextStatus: TicketStatus) {
    if (!isValidTransition(this.ticket.status, nextStatus)) {
      throw new HttpError(400, TicketErrorCode.INVALID_STATUS_TRANSITION);
    }

    if (
      nextStatus === 'CLOSED' &&
      !this.user.permissions.includes(TicketPermissionMatrix.close.any)
    ) {
      throw new HttpError(403, TicketErrorCode.FORBIDDEN);
    }

    return true;
  }

  canUpdateField(field: keyof Pick<Ticket, 'priority' | 'assignedToId'>) {
    if (field === 'priority') {
      if (
        !this.user.permissions.includes(TicketPermissionMatrix.update.any) &&
        !(TicketPermissionMatrix.update.own &&
          this.user.permissions.includes(TicketPermissionMatrix.update.own))
      ) {
        throw new HttpError(403, `FORBIDDEN_FIELD_${field.toUpperCase()}`);
      }
    }

    if (field === 'assignedToId') {
      if (!this.user.permissions.includes(TicketPermissionMatrix.update.any)) {
        throw new HttpError(403, `FORBIDDEN_FIELD_${field.toUpperCase()}`);
      }
    }

    return true;
  }
}
