import type { User, Session } from '@/generated/prisma/client';
import type { AuthUser } from './auth.policy.js';
import { AuthPolicy } from './auth.policy.js';
import { canUpdateField } from './auth.field-policy.js';

/**
 * checkAuthAccess
 * 对应 checkTicketAccess
 */
export function checkAuthAccess(
  user: AuthUser,
  targetUser: User,
  action: 'view' | 'update' | 'revoke',
  session?: Session,
) {
  AuthPolicy.assert(user, targetUser, session).can(action);
}

/**
 * checkUserFieldPermission
 * 对应 checkFieldPermission
 */
export function checkUserFieldPermission(
  user: AuthUser,
  field: 'passwordHash' | 'role',
) {
  canUpdateField(user, field);
}
