import { AuthStore, UserUpdateData, SessionCreateData } from './auth.store.js';
import { AuthPolicy } from './auth.policy.js';
import type { User, Session } from '@/generated/prisma/client';
import type { AuthUser } from './auth.policy.js';
import { HttpError } from '@/errors/http-error.js';
import { AuthErrorCode } from './auth.errors.js';

export const AuthService = {
  /**
   * createSession
   * 对应 ticket.create
   */
  async createSession(
    user: AuthUser,
    data: SessionCreateData,
  ) {
    // 自动注入 userId
    data.userId = user.id;
    return AuthStore.createSession(data);
  },

  /**
   * updateUser
   * 对应 ticket.update
   */
  async updateUser(
    user: AuthUser,
    targetUser: User,
    data: UserUpdateData,
  ) {
    AuthPolicy.assert(user, targetUser).can('update');

    if (data.passwordHash)
      AuthPolicy.assert(user, targetUser).canUpdateField('passwordHash');

    if (data.isActive !== undefined)
      AuthPolicy.assert(user, targetUser).canUpdateField('isActive');

    if (data.teamId !== undefined)
      AuthPolicy.assert(user, targetUser).canUpdateField('teamId');

    return AuthStore.updateUser(targetUser.id, data);
  },

  /**
   * getUser
   * 对应 ticket.get
   */
  async getUser(
    user: AuthUser,
    targetUser: User,
  ) {
    AuthPolicy.assert(user, targetUser).can('view');
    return targetUser;
  },

  /**
   * revokeSession
   * 对应 ticket.close
   */
  async revokeSession(
    user: AuthUser,
    sessionId: string,
  ) {
    const session = await AuthStore.findSessionById(sessionId);
    if (!session) throw new HttpError(404, AuthErrorCode.SESSION_NOT_FOUND);

    AuthPolicy.assert(user, session.User, session).canRevokeSession();
    return AuthStore.revokeSession(session.id);
  },
};
