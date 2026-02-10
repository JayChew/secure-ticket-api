import { AuthState } from './auth.state';

export const AuthStateMachine = {
  login: {
    from: [AuthState.ANONYMOUS],
    to: AuthState.AUTHENTICATED,
  },

  expireToken: {
    from: [AuthState.AUTHENTICATED],
    to: AuthState.TOKEN_EXPIRED,
  },

  logout: {
    from: [
      AuthState.AUTHENTICATED,
      AuthState.TOKEN_EXPIRED,
    ],
    to: AuthState.REVOKED,
  },
} as const;
