import { redis } from '@/lib/redis.js';
import { prisma } from '@/lib/prisma.js';
import type { Request, Response, NextFunction } from 'express';

export async function requireActiveOrganization(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const cacheKey = `org:${orgId}:isActive`;
  let isActive = await redis.get(cacheKey);

  if (isActive === null) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { isActive: true },
    });
    isActive = org?.isActive ? '1' : '0';
    await redis.set(cacheKey, isActive, 'EX', 60); // 缓存 60 秒
  }

  if (isActive !== '1') {
    return res.status(403).json({ error: 'ORG_DISABLED' });
  }

  next();
}

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const orgId = req.user?.organizationId;

  const sub = await prisma.subscription.findFirst({
    where: {
      organizationId: orgId,
      isActive: true,
      deletedAt: null,
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } },
      ],
    },
    select: { id: true },
  });

  if (!sub) {
    return res.status(402).json({
      error: 'SUBSCRIPTION_REQUIRED',
    });
  }

  req.subscriptionId = sub.id;
  next();
}