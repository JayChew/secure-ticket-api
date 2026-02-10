import { TicketStatus } from '@/generated/prisma/client';

export const StatusTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED: [],
  RESOLVED: ['CLOSED'],
};

export function canTransition(current: TicketStatus, next: TicketStatus) {
  return StatusTransitions[current]?.includes(next);
}