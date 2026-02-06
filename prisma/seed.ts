import { parseArgs } from "node:util";
import { prisma } from "../src/lib/prisma.js";
import type { SeederEnvironment } from "./seeders/types.js";

import { OrganizationSeeder } from "./seeders/OrganizationSeeder.js";
import { RoleSeeder } from "./seeders/RoleSeeder.js";
import { UserSeeder } from "./seeders/UserSeeder.js";
import { TicketSeeder } from "./seeders/TicketSeeder.js";

const {
  values: { environment },
} = parseArgs({ options: { environment: { type: "string" } } });

if (!environment) {
  throw new Error("--environment is required");
}

const env = environment as SeederEnvironment;

async function main() {
  const orgResult = await new OrganizationSeeder(prisma, env).run();
  const rolesResult = await new RoleSeeder(prisma, env).run();

  const userResult = await new UserSeeder(prisma, env, {
    orgId: orgResult.org.id,
    teamId: orgResult.team.id,
    adminRoleId: rolesResult.adminRole.id,
    agentRoleId: rolesResult.agentRole.id,
    userRoleId: rolesResult.userRole.id,
  }).run();

  await new TicketSeeder(prisma, env, {
    orgId: orgResult.org.id,
    teamId: orgResult.team.id,
    agentsEmails: userResult.agentsEmails,
    usersEmails: userResult.usersEmails,
  }).run();

  console.log("🎉 All seeders finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
