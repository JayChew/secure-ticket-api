import { HttpError } from '@/errors/http-error.js';
import { OrgErrorCode } from '@/modules/org/org.errors.js';
import express from 'express';

export function requireActiveSubscription(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  if (!req.subscriptionId) {
    throw new HttpError(403, OrgErrorCode.SUBSCRIPTION_INACTIVE);
  }
  next();
}
