import { Role, Permission } from "../../src/generated/prisma/client.js";
import { PermissionCreateInput } from "../../src/generated/prisma/models.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class RoleSeeder extends BaseSeeder<{
  adminRole: Role;
  agentRole: Role;
  userRole: Role;
}> {
  async run() {
    // if (this.env === "production") {
    //   throw new Error("Cannot run RoleSeeder in production");
    // }

    // 创建角色
    const [adminRole, agentRole, userRole]: [Role, Role, Role] =
      await Promise.all([
        this.prisma.role.upsert({ where: { name: "ADMIN" }, create: { name: "ADMIN" }, update: { name: "ADMIN" } }),
        this.prisma.role.upsert({ where: { name: "AGENT" }, create: { name: "AGENT" }, update: { name: "AGENT" } }),
        this.prisma.role.upsert({ where: { name: "USER" }, create: { name: "USER" }, update: { name: "USER" } }),
      ]);

    // 创建权限
    const permissionsData: PermissionCreateInput[] = [
      { action: "CREATE", resource: "TICKET", key: "ticket:create", scope: "TICKET", description: "Create ticket", isActive: true },
      { action: "READ", resource: "TICKET", key: "ticket:read", scope: "TICKET", description: "Read ticket", isActive: true },
      { action: "UPDATE", resource: "TICKET", key: "ticket:update", scope: "TICKET", description: "Update ticket", isActive: true },
      { action: "DELETE", resource: "TICKET", key: "ticket:delete", scope: "TICKET", description: "Delete ticket", isActive: true },
      { action: "CREATE", resource: "USER", key: "user:create", scope: "USER", description: "Create user", isActive: true },
      { action: "READ", resource: "USER", key: "user:read", scope: "USER", description: "Read user", isActive: true },
      { action: "UPDATE", resource: "USER", key: "user:update", scope: "USER", description: "Update user", isActive: true },
      { action: "DELETE", resource: "USER", key: "user:delete", scope: "USER", description: "Delete user", isActive: true },
    ];

    const permissionRecords: Permission[] = await Promise.all(
      permissionsData.map((p) => this.prisma.permission.upsert({ where: { key: p.key }, create: p, update: p })),
    );

    // 分配权限
    const rolePermissionsMap = {
      ADMIN: permissionsData,
      AGENT: permissionsData.filter((p) => p.resource === "TICKET"),
      USER: permissionsData.filter(
        (p) => p.resource === "TICKET" && p.action === "READ",
      ),
    };

    for (const [roleName, perms] of Object.entries(rolePermissionsMap)) {
      const role =
        roleName === "ADMIN"
          ? adminRole
          : roleName === "AGENT"
            ? agentRole
            : userRole;
      await Promise.all(
        perms.map((p) => {
          const perm = permissionRecords.find(
            (pr) => pr.action === p.action && pr.resource === p.resource,
          )!;
          return this.prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
            create: { roleId: role.id, permissionId: perm.id },
            update: { roleId: role.id, permissionId: perm.id },
          });
        }),
      );
    }

    console.log("✅ Roles and permissions created");
    return { adminRole, agentRole, userRole };
  }
}
