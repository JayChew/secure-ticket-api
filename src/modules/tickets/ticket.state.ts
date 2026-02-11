import type { TicketStatus } from "@/generated/prisma/client";
import { HttpError } from "@/errors/http-error.js";
import { TicketErrorCode } from "./ticket.errors.js"; 

export const TicketStateTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["CLOSED", "RESOLVED"],
  CLOSED: [],
  RESOLVED: ["CLOSED", "OPEN"],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TicketStateTransitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: TicketStatus, to: TicketStatus) {
  if (!canTransition(from, to)) {
    throw new HttpError(400, TicketErrorCode.INVALID_STATUS_TRANSITION);
  }
}
