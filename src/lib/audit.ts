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
  try {
    return await prisma.auditLog.create({
      data: input,
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
    throw new Error('Failed to log audit', { cause: error });
  }
}