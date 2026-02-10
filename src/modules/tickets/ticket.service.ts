import { TicketStore, TicketCreateData, TicketUpdateData } from './ticket.store.js';
import { TicketPolicy } from './ticket.policy.js';
import type { Ticket } from '@/generated/prisma/client';
import type { AuthUser } from './ticket.policy.js';

export const TicketService = {
  async create(user: AuthUser, data: TicketCreateData) {
    // 自动注入创建者
    data.createdById = user.id;
    return TicketStore.create(data);
  },

  async update(user: AuthUser, ticket: Ticket, data: TicketUpdateData) {
    TicketPolicy.assert(user, ticket).can('update');

    if (data.priority) TicketPolicy.assert(user, ticket).canUpdateField('priority');
    if (data.assignedToId) TicketPolicy.assert(user, ticket).canUpdateField('assignedToId');
    if (data.status) TicketPolicy.assert(user, ticket).canTransition(data.status);

    return TicketStore.update(ticket.id, data);
  },

  async get(user: AuthUser, ticket: Ticket) {
    TicketPolicy.assert(user, ticket).can('view');
    return ticket;
  },
};
