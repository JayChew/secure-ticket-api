import { prisma } from "@/lib/prisma.js";
import type { TicketStatus, Priority } from "@/generated/prisma/client";
import type {
  TicketCreateInput,
  TicketUpdateInput,
  TicketWhereInput,
  TicketOrderByWithRelationInput
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

  list: (where: TicketWhereInput, options: { skip: number; take: number; orderBy: TicketOrderByWithRelationInput;}) =>
    prisma.ticket.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: {
        Team: true,
        User_Ticket_assignedToIdToUser: true,
        User_Ticket_createdByIdToUser: true,
      },
    }),
  
  count: (where: TicketWhereInput) => prisma.ticket.count({ where }),
};
