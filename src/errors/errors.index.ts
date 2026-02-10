export { AuthErrorCode } from '@/modules/auth/auth.errors.js';
export { TicketErrorCode } from '@/modules/tickets/ticket.errors.js';
export { OrgErrorCode } from '@/modules/org/org.errors.js';

export type ApiErrorCode =
  | typeof import('@/modules/auth/auth.errors.js').AuthErrorCode[keyof typeof import('@/modules/auth/auth.errors.js').AuthErrorCode]
  | typeof import('@/modules/tickets/ticket.errors.js').TicketErrorCode[keyof typeof import('@/modules/tickets/ticket.errors.js').TicketErrorCode]
  | typeof import('@/modules/org/org.errors.js').OrgErrorCode[keyof typeof import('@/modules/org/org.errors.js').OrgErrorCode];
