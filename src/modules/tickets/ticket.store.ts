import { prisma } from "@/lib/prisma.js";
import type { TicketStatus, Priority } from "@/generated/prisma/client";
import type {
  TicketCreateInput,
  TicketUpdateInput,
} from "@/generated/prisma/models/Ticket.js";

export type TicketCreateData = {
  title: string;
  description: string;
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

  create: (data: TicketCreateInput) => prisma.ticket.create({ data }),

  update: (id: string, data: TicketUpdateInput) =>
    prisma.ticket.update({ where: { id }, data }),
};
