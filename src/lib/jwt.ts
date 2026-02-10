import jwt from 'jsonwebtoken';
import type { JwtPayload } from './jwt.types.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_TTL = '15m';

export function issueAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
