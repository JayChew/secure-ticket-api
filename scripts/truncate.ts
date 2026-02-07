import { prisma } from "../src/lib/prisma.js";

async function truncateAll() {
  // Get all table names in the public schema
  const tablenames = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  const tables = tablenames
    .map(({ tablename }: { tablename: string }) => tablename)
    .filter((name: string) => name !== '_prisma_migrations') // keep migrations
    .map((name: string) => `"public"."${name}"`)
    .join(', ')

  try {
    // Truncate all tables and reset identities, cascading FKs
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
}

truncateAll()
  .finally(() => prisma.$disconnect())
