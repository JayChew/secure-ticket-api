import {
  PrismaClient,
  TicketStatus,
  Priority,
  Organization,
  Team,
  User,
} from "../../src/generated/prisma/client.js";
import { BaseSeeder } from "./BaseSeeder.js";

interface TicketSeederOptions {
  orgId: Organization["id"];
  teamId: Team["id"];
  agentsEmails: User["email"][];
  usersEmails: User["email"][];
}

export class TicketSeeder extends BaseSeeder<void, TicketSeederOptions> {
  async run() {
    // if (this.env === "production") {
    //   throw new Error("Cannot run TicketSeeder in production");
    // }

    if (!this.context) throw new Error("TicketSeeder requires context");
    const { context } = this;

    const agents: User[] = await this.prisma.user.findMany({
      where: { email: { in: context.agentsEmails } },
    });
    const users: User[] = await this.prisma.user.findMany({
      where: { email: { in: context.usersEmails } },
    });

    const demoTickets = [
      {
        title: "Issue with login",
        description: "User cannot login to the system",
        createdBy: users[0],
        assignedTo: agents[0],
        priority: Priority.HIGH,
        status: TicketStatus.OPEN,
      },
      {
        title: "Error on checkout page",
        description: "Checkout button does not respond",
        createdBy: users[1],
        assignedTo: agents[1],
        priority: Priority.URGENT,
        status: TicketStatus.IN_PROGRESS,
      },
      {
        title: "Bug in ticket list",
        description: "Tickets are not loading correctly",
        createdBy: users[2],
        assignedTo: agents[2],
        priority: Priority.MEDIUM,
        status: TicketStatus.RESOLVED,
      },
      {
        title: "Request new feature",
        description: "Add dark mode to UI",
        createdBy: users[0],
        assignedTo: agents[1],
        priority: Priority.LOW,
        status: TicketStatus.CLOSED,
      },
    ];

    for (const t of demoTickets) {
      await this.prisma.ticket.create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          organizationId: context.orgId,
          teamId: context.teamId,
          createdById: t.createdBy!.id,
          assignedToId: t.assignedTo!.id,
        },
      });
    }

    console.log("✅ Demo tickets created");
  }
}
