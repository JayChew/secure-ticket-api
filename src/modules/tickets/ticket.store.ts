import { prisma } from '@/lib/prisma.js';
import type { Ticket, TicketStatus, Priority } from '@/generated/prisma/client';

export type TicketCreateData = {
  title: string;
  description: string;
  organizationId: string;
  createdById: string;
  teamId?: string | null;
  priority?: Priority;
  assignedToId?: string | null;
  status?: TicketStatus;
};

export type TicketUpdateData = Partial<{
  title: string;
  description: string;
  teamId: string | null;
  priority: Priority;
  assignedToId: string | null;
  status: TicketStatus;
}>;

export const TicketStore = {
  findById: (id: string) => prisma.ticket.findUnique({ where: { id } }),

  create: (data: TicketCreateData) => prisma.ticket.create({ data }),

  update: (id: string, data: TicketUpdateData) =>
    prisma.ticket.update({ where: { id }, data }),
};
