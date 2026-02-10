import { auditLog } from '@/lib/audit.js';
import type { Request } from 'express';

export async function auditError(
  err: { code: string; status: number },
  req: Request,
) {
  if (!req.user) return;

  // 只记录 4xx 业务错误
  if (err.status < 400 || err.status >= 500) return;

  await auditLog({
    organizationId: req.user.organizationId,
    userId: req.user.id,
    action: `error.${err.code}`,
    entityType: 'ticket', // 或从 req context 推导
    entityId: req.params?.id as string ?? 'N/A',
    metadata: {
      path: req.path,
      method: req.method,
    },
  });
}
