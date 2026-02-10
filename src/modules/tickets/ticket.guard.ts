import type { Ticket } from '@/generated/prisma/client';
import type { AuthUser } from './ticket.policy.js';
import { TicketPolicy } from './ticket.policy.js';
import { canUpdateField } from './ticket.field-policy.js';

export function checkTicketAccess(user: AuthUser, ticket: Ticket, action: 'view' | 'update' | 'close') {
  TicketPolicy.assert(user, ticket).can(action);
}

export function checkFieldPermission(user: AuthUser, field: 'priority' | 'assignedToId') {
  canUpdateField(user, field);
}