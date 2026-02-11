import type { TicketStatus } from "@/generated/prisma/client";

export const TicketStateTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["CLOSED"],
  CLOSED: [],
  RESOLVED: ["CLOSED", "OPEN"],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TicketStateTransitions[from]?.includes(to) ?? false;
}
