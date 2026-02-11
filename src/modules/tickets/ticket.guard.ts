import type { Ticket } from "@/generated/prisma/client";
import type { AuthUser } from "@/modules/auth/auth.types";
import { TicketPolicy } from "./ticket.policy.js";
import { canUpdateField } from "./ticket.field-policy.js";

/**
 * Ticket 级别访问检查
 * 会抛出 HttpError 如果用户无权操作
 */
export function checkTicketAccess(
  user: AuthUser,
  ticket: Ticket,
  action: "view" | "update" | "close",
) {
  TicketPolicy.assert(user, ticket).can(action);
}

/**
 * Ticket 字段级权限检查
 * 会抛出 HttpError 如果用户无权更新该字段
 */
export function checkFieldPermission(
  user: AuthUser,
  field: "priority" | "assignedToId",
) {
  canUpdateField(user, field);
}
