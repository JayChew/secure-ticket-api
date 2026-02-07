import {
  Organization,
  Team,
  Role,
  User,
} from "../../src/generated/prisma/client.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { hash } from "bcrypt";

interface UserSeederOptions {
  orgId: Organization["id"];
  teamId: Team["id"];
  adminRoleId: Role["id"];
  agentRoleId: Role["id"];
  userRoleId: Role["id"];
}

export class UserSeeder extends BaseSeeder<{
  agentsEmails: User["email"][];
  usersEmails: User["email"][];
}, UserSeederOptions> {
  async run() {
    // if (this.env === "production") {
    //   throw new Error("Cannot run UserSeeder in production");
    // }

    if (!this.context) throw new Error("UserSeeder requires context");
    const { context } = this;

    const passwordHash = await hash("Password123!", 10);

    // Admin
    await this.prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        organizationId: context.orgId,
        teamId: context.teamId,
        UserRole: { create: [{ roleId: context.adminRoleId }] },
      },
    });

    // Agents
    const agentsEmails = [
      "agent1@example.com",
      "agent2@example.com",
      "agent3@example.com",
    ];
    await Promise.all(
      agentsEmails.map((email) =>
        this.prisma.user.create({
          data: {
            email,
            passwordHash,
            organizationId: context.orgId,
            teamId: context.teamId,
            UserRole: { create: [{ roleId: context.agentRoleId }] },
          },
        }),
      ),
    );

    // Users
    const usersEmails = [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com",
    ];
    await Promise.all(
      usersEmails.map((email) =>
        this.prisma.user.create({
          data: {
            email,
            passwordHash,
            organizationId: context.orgId,
            teamId: context.teamId,
            UserRole: { create: [{ roleId: context.userRoleId }] },
          },
        }),
      ),
    );

    console.log("✅ Users created");
    return { agentsEmails, usersEmails };
  }
}
