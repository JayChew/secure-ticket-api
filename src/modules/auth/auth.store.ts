import { prisma } from '@/lib/prisma.js';
import type { User, Session } from '@/generated/prisma/client';

/**
 * Session
 * 对应 TicketCreateData
 */
export type SessionCreateData = {
  userId: string;
  refreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
};

/**
 * User
 * 对应 TicketUpdateData
 */
export type UserUpdateData = Partial<{
  passwordHash: string;
  isActive: boolean;
  teamId: string | null;
}>;

export const AuthStore = {
  /**
   * User
   */
  findUserById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        UserRole: {
          include: {
            Role: {
              include: {
                RolePermission: {
                  include: {
                    Permission: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

  findUserByEmail: (organizationId: string, email: string) =>
    prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
      include: {
        UserRole: {
          include: {
            Role: {
              include: {
                RolePermission: {
                  include: {
                    Permission: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

  updateUser: (id: string, data: UserUpdateData) =>
    prisma.user.update({ where: { id }, data }),

  /**
   * Session
   */
  findSessionById: (id: string) =>
    prisma.session.findUnique({ where: { id }, include: { User: true } }),

  findSessionByRefreshToken: (refreshToken: string) =>
    prisma.session.findUnique({ where: { refreshToken } }),

  createSession: (data: SessionCreateData) =>
    prisma.session.create({ data }),

  revokeSession: (id: string) =>
    prisma.session.delete({ where: { id } }),
};
