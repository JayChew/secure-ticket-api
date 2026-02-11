import type { AuthUser } from "@/modules/auth/auth.types";

declare global {
  namespace Express {
    /**
     * HTTP 层 User = AuthUser
     * ❌ 不允许加字段
     */
    interface User extends AuthUser {}

    interface Request {
      user?: User;
      subscriptionId?: string;
    }
  }
}

export {};
