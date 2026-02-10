import type { TicketStatus } from '@/generated/prisma/client';

export const TicketStateMachine: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED: [],
  RESOLVED: ['CLOSED'],
};

export function canTransitionState(current: TicketStatus, next: TicketStatus) {
  return TicketStateMachine[current].includes(next);
}