import { HttpError } from '@/errors/http-error.js';
import { AuthErrorCode } from './auth.errors.js';
import type { User, Session, UserRole } from '@/generated/prisma/client';
import type { PermissionKey } from '@/docs/permissions.openapi.js';

/**
 * Auth actions
 * 对应 ticket 的 view / update / close
 */
export type AuthAction = 'view' | 'update' | 'revoke';

/**
 * Permission rule
 * 与 TicketPermissionMatrix 完全一致
 */
export type PermissionRule = {
  any: PermissionKey;
  own?: PermissionKey;
};

/**
 * Auth permission matrix
 * permission key 直接来自 DB / openapi
 */
const AuthPermissionMatrix: Record<AuthAction, PermissionRule> = {
  view: { any: 'auth:session:view:any', own: 'auth:session:view:own' },
  update: { any: 'auth:user:update' },
  revoke: { any: 'auth:session:revoke' },
};

/**
 * AuthUser
 * 与 ticket.policy.ts 的 AuthUser 结构一致
 */
export type AuthUser = {
  id: string;
  permissions: PermissionKey[];
  organizationId: User['organizationId'];
  roles?: UserRole[];
};

/**
 * AuthPolicy
 * ticket → auth 的一对一翻译
 */
export class AuthPolicy {
  constructor(
    private user: AuthUser,
    private targetUser: User,
    private session?: Session,
  ) {}

  static assert(
    user: AuthUser,
    targetUser: User,
    session?: Session,
  ) {
    return new AuthPolicy(user, targetUser, session);
  }

  /**
   * can(action)
   * 与 TicketPolicy.can 完全同构
   */
  can(action: AuthAction) {
    const rule = AuthPermissionMatrix[action];

    if (rule.any && this.user.permissions.includes(rule.any)) return true;

    if (
      rule.own &&
      this.user.permissions.includes(rule.own) &&
      this.user.id === this.targetUser.id
    )
      return true;

    throw new HttpError(403, AuthErrorCode.FORBIDDEN);
  }

  /**
   * canRevokeSession
   * 对应 ticket 的 canTransition + close 特判
   */
  canRevokeSession() {
    if (!this.session) {
      throw new HttpError(404, AuthErrorCode.SESSION_NOT_FOUND);
    }

    if (
      this.session.userId !== this.user.id &&
      !this.user.permissions.includes(AuthPermissionMatrix.revoke.any)
    ) {
      throw new HttpError(403, AuthErrorCode.FORBIDDEN);
    }

    return true;
  }

  /**
   * canUpdateField
   * 与 ticket.policy.ts 的字段级校验完全一致
   */
  canUpdateField(
    field: keyof Pick<User, 'passwordHash' | 'isActive' | 'teamId'>,
  ) {
    if (field === 'passwordHash') {
      if (
        !this.user.permissions.includes(AuthPermissionMatrix.update.any) &&
        this.user.id !== this.targetUser.id
      ) {
        throw new HttpError(
          403,
          `FORBIDDEN_FIELD_${field.toUpperCase()}`,
        );
      }
    }

    if (field === 'isActive' || field === 'teamId') {
      if (!this.user.permissions.includes(AuthPermissionMatrix.update.any)) {
        throw new HttpError(
          403,
          `FORBIDDEN_FIELD_${field.toUpperCase()}`,
        );
      }
    }

    return true;
  }
}
