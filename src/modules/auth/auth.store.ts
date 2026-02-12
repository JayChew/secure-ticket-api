import { prisma } from "@/lib/prisma.js";
import type { User, Session } from "@/generated/prisma/client";
import type { SessionCreateInput } from "@/generated/prisma/models/Session";

export type UserUpdateData = Partial<{
  passwordHash: string;
  isActive: boolean;
  teamId: string | null;
}>;

export type SessionCreateData = {
  userAgent: string | null;
  ipAddress: string | undefined;
  refreshTokenHash: string;
  expiresAt: Date;
  userId?: string;
};

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
    prisma.session.findUnique({ where: { id }, include: { user: true } }),

  findActiveSessionById(sessionId: string) {
    return prisma.session.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  },

  findSessionByRefreshToken: (refreshTokenHash: string) =>
    prisma.session.findFirst({
      where: { refreshTokenHash },
      include: { user: true },
    }),

  createSession: (data: SessionCreateData) => {
    const sessionData: SessionCreateInput = {
      user: { connect: { id: data.userId! } },
      refreshTokenHash: data.refreshTokenHash,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      createdAt: new Date(),
    };
    return prisma.session.create({ data: sessionData });
  },

  rotateRefreshToken(
    sessionId: string,
    data: {
      refreshTokenHash: string;
      expiresAt: Date;
    },
  ) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        revokedAt: null,
      },
    });
  },

  revokeSession(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  revokeAllSessions(userId: string) {
    return prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
};
