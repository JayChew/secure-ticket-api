// index.ts
// Query your database using the Prisma Client

import 'dotenv/config'
import { ffs } from "./generated/ffs.js";
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Example query to create a user based on the example schema

async function main() {
  console.log(ffs);
  const user = await prisma.user.create({
    data: {
      id: '8',
      email: 'bw2222wwwwwwww44422ob@prisma.io',
      passwordHash: 'password',
      updatedAt: new Date(),
      organizationId: '1',
    },
  })

  console.log(user)
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

