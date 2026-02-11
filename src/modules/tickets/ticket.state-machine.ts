import type { Ticket, TicketStatus } from "@/generated/prisma/client";
import { TicketPolicy } from "./ticket.policy.js";
import { assertTransition } from "./ticket.state.js";
import { TicketStore } from "./ticket.store.js";
import type { AuthUser } from "@/modules/auth/auth.types";

// 状态更新 Service 封装
export const TicketStateMachineService = {
  async transition(user: AuthUser, ticket: Ticket, nextStatus: TicketStatus) {
    const policy = TicketPolicy.assert(user, ticket);

    // RBAC + 状态权限校验
    policy.can("update");
    policy.canTransition(nextStatus);

    // 状态机合法性校验
    assertTransition(ticket.status, nextStatus);

    // DB 更新
    return TicketStore.update(ticket.id, { status: nextStatus });
  },
};
