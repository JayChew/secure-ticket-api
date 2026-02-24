import { TicketStore } from "./ticket.store.js";
import type {
  TicketCreateInput,
  TicketUpdateInput,
} from "@/generated/prisma/models/Ticket.js";
import type { TicketCreateData, TicketUpdateData } from "./ticket.store.js";
import { TicketPolicy } from "./ticket.policy.js";
import type { Ticket, TicketStatus } from "@/generated/prisma/client";
import type { AuthUser } from "@/modules/auth/auth.types";

type TicketListParams = {
  status?: string;
  priority?: string;
  teamId?: string;
  assignedTo?: string;
  page: number;
  pageSize: number;
};


export const TicketService = {
  // -------------------------
  // Create Ticket
  // -------------------------
  async create(user: AuthUser, data: TicketCreateData) {
    // 自动注入创建者和组织
    const ticketData: TicketCreateInput = {
      ...data,
      User_Ticket_createdByIdToUser: { connect: { id: user.id } },
      Organization: { connect: { id: user.organizationId } },
    };

    const ticket = await TicketStore.create(ticketData);

    return ticket;
  },

  // -------------------------
  // Update Ticket
  // -------------------------
  async update(user: AuthUser, ticket: Ticket, data: TicketUpdateData) {
    const policy = TicketPolicy.assert(user, ticket);

    // RBAC 检查
    policy.can("update");

    // 字段级权限检查
    if (data.priority !== undefined) policy.canUpdateField("priority");
    if (data.assignedToId !== undefined) policy.canUpdateField("assignedToId");

    // 状态机校验
    if (data.status) policy.canTransition(data.status);

    const ticketData: TicketUpdateInput = {
      title: data.title,
      description: data.description,
      Team: data.teamId
        ? { connect: { id: data.teamId } }
        : data.teamId === null
          ? { disconnect: true }
          : undefined,
      priority: data.priority,
      User_Ticket_assignedToIdToUser: data.assignedToId
        ? { connect: { id: data.assignedToId } }
        : data.assignedToId === null
          ? { disconnect: true }
          : undefined,
      status: data.status,
    };

    // 更新 DB
    return TicketStore.update(ticket.id, ticketData);
  },

  // -------------------------
  // Get Ticket
  // -------------------------
  async get(user: AuthUser, ticket: Ticket) {
    TicketPolicy.assert(user, ticket).can("view");
    return ticket;
  },

  // -------------------------
  // Find by ID + RBAC
  // -------------------------
  async findById(user: AuthUser, id: string) {
    const ticket = await TicketStore.findById(id);
    if (!ticket) return null;

    TicketPolicy.assert(user, ticket).can("view");
    return ticket;
  },

  // -------------------------
  // List Tickets
  // -------------------------
  async list(user: AuthUser, params: TicketListParams) {
    const policy = TicketPolicy.forUser(user);

    // 1️⃣ 构建 where（RBAC + filters）
    const where = policy.buildListWhere({
      organizationId: user.organizationId,
      status: params.status as TicketStatus,
      priority: params.priority,
      teamId: params.teamId,
      assignedTo: params.assignedTo,
    });

    // 2️⃣ 排序（可固定或来自 query）
    const orderBy = { createdAt: "desc" as const };

    // 3️⃣ 分页
    const skip = (params.page - 1) * params.pageSize;
    const take = params.pageSize;

    // 4️⃣ 查询
    const [items, total] = await Promise.all([
      TicketStore.list(where, { skip, take, orderBy }),
      TicketStore.count(where),
    ]);

    return {
      items,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },
};
