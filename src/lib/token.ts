import crypto from 'crypto';

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}