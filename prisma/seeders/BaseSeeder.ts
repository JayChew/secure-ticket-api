import type { SeederEnvironment } from './types';
import { PrismaClient } from "../../src/generated/prisma/client.js";
export abstract class BaseSeeder<T = void, C = void> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly env: SeederEnvironment,
    protected readonly context?: C
  ) {}
  abstract run(): Promise<T>;
}
