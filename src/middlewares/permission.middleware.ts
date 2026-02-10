import { HttpError } from '@/errors/http-error.js';
import { TicketErrorCode } from '@/modules/tickets/ticket.errors.js';
import express from 'express';
import type { PermissionKey } from '@/docs/permissions.openapi.ts';

export function requirePermission(permission: PermissionKey) {
  return (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    if (!req.user?.permissions.includes(permission)) {
      throw new HttpError(403, TicketErrorCode.FORBIDDEN);
    }
    next();
  };
}