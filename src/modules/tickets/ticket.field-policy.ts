import type { AuthUser } from './ticket.policy.js';

export function canUpdateField(user: AuthUser, field: 'priority' | 'assignedToId') {
  if (field === 'priority') {
    return user.permissions.includes('ticket:update');
  }
  if (field === 'assignedToId') {
    return user.permissions.includes('ticket:update');
  }
  return false;
}
