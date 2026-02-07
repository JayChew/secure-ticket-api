import {
  PrismaClient,
  Organization,
  Team,
} from "../../src/generated/prisma/client.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class OrganizationSeeder extends BaseSeeder<{
  org: Organization;
  team: Team;
}> {
  async run() {
    // if (this.env === "production") {
    //   throw new Error("Cannot run OrganizationSeeder in production");
    // }

    const org = await this.prisma.organization.create({
      data: { name: "Default Organization" },
    });

    const team = await this.prisma.team.create({
      data: { name: "Support Team", organizationId: org.id },
    });

    return { org, team };
  }
}
