// src/index.ts
import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import authRoutes from './modules/auth/auth.routes.js';
import ticketRoutes from './modules/tickets/ticket.routes.js';
import { HttpError } from './errors/http-error.js';
import { auditError } from './audit/audit-error.js';

dotenv.config();

const app = express();

app.use(json());
app.use(cookieParser());

// -------------------------
// Health Check
// -------------------------
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

// -------------------------
// Auth Routes
// -------------------------
app.use('/auth', authRoutes);

// -------------------------
// Ticket Routes
// -------------------------
app.use('/tickets', ticketRoutes);

// -------------------------
// Error Handler
// -------------------------

app.use(async (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (err instanceof HttpError) {
    await auditError(err, req);

    return res.status(err.status).json({
      error: err.code,
    });
  }

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
  });
});

// -------------------------
// Start Server
// -------------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
