import type { AuthUser } from "@/modules/auth/auth.types";
import { TicketPermissionMatrix } from "./ticket.permissions.js";

/**
 * 字段级更新权限
 * 如果没有权限，会抛出 HttpError
 */
export function canUpdateField(
  user: AuthUser,
  field: "priority" | "assignedToId",
) {
  // 优先用 update:any 权限
  const hasUpdateAny = user.permissions.includes(
    TicketPermissionMatrix.update.any,
  );

  // 更新自己创建的 ticket 需要 update:own 权限
  const hasUpdateOwn = TicketPermissionMatrix.update.own
    ? user.permissions.includes(TicketPermissionMatrix.update.own)
    : false;

  if (field === "priority") {
    if (!hasUpdateAny && !hasUpdateOwn) {
      throw new Error(`FORBIDDEN_FIELD_${field.toUpperCase()}`);
    }
  }

  if (field === "assignedToId") {
    if (!hasUpdateAny) {
      throw new Error(`FORBIDDEN_FIELD_${field.toUpperCase()}`);
    }
  }

  return true;
}
