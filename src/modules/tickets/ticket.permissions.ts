import type { PermissionKey } from '@/docs/permissions.openapi.js';

export type TicketAction = 'view' | 'update' | 'close';
export type PermissionRule = { any: PermissionKey; own?: PermissionKey };

export const TicketPermissionMatrix: Record<TicketAction, PermissionRule> = {
  view: { any: 'ticket:view:any', own: 'ticket:view:own' },
  update: { any: 'ticket:update' },
  close: { any: 'ticket:close' },
};