import type { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/lib/prisma.js';

export async function auditLog(input: {
  organizationId: string;
  userId: string;
  action: string;
  entityType: 'ticket' | 'user' | 'session';
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: input,
  });
}