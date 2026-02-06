import { PrismaClient, Role, Permission } from "../../src/generated/prisma/client.js";
import { PermissionCreateInput } from "../../src/generated/prisma/models.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class RoleSeeder extends BaseSeeder<{
  adminRole: Role;
  agentRole: Role;
  userRole: Role;
}> {
  async run() {
    if (this.env === "production") {
      throw new Error("Cannot run RoleSeeder in production");
    }

    // 创建角色
    const [adminRole, agentRole, userRole]: [Role, Role, Role] =
      await Promise.all([
        this.prisma.role.create({ data: { name: "ADMIN" } }),
        this.prisma.role.create({ data: { name: "AGENT" } }),
        this.prisma.role.create({ data: { name: "USER" } }),
      ]);

    // 创建权限
    const permissionsData: PermissionCreateInput[] = [
      { action: "CREATE", resource: "TICKET" },
      { action: "READ", resource: "TICKET" },
      { action: "UPDATE", resource: "TICKET" },
      { action: "DELETE", resource: "TICKET" },
      { action: "CREATE", resource: "USER" },
      { action: "READ", resource: "USER" },
      { action: "UPDATE", resource: "USER" },
      { action: "DELETE", resource: "USER" },
    ];

    const permissionRecords: Permission[] = await Promise.all(
      permissionsData.map((p) => this.prisma.permission.create({ data: p })),
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
          return this.prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          });
        }),
      );
    }

    console.log("✅ Roles and permissions created");
    return { adminRole, agentRole, userRole };
  }
}
