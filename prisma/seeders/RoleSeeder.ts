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
      // ===== Ticket =====
      { key: "ticket:list:any", action: "LIST", resource: "TICKET", scope: "ANY", description: "List any tickets", isActive: true },
      { key: "ticket:list:own", action: "LIST", resource: "TICKET", scope: "OWN", description: "List own tickets", isActive: true },

      { key: "ticket:view:any", action: "VIEW", resource: "TICKET", scope: "ANY", description: "View any ticket", isActive: true },
      { key: "ticket:view:own", action: "VIEW", resource: "TICKET", scope: "OWN", description: "View own ticket", isActive: true },

      { key: "ticket:create", action: "CREATE", resource: "TICKET", scope: "ANY", description: "Create ticket", isActive: true },

      { key: "ticket:update:any", action: "UPDATE", resource: "TICKET", scope: "ANY", description: "Update any ticket", isActive: true },
      { key: "ticket:update:own", action: "UPDATE", resource: "TICKET", scope: "OWN", description: "Update own ticket", isActive: true },

      { key: "ticket:close", action: "CLOSE", resource: "TICKET", scope: "ANY", description: "Close ticket", isActive: true },
    ];

    const permissionRecords: Permission[] = await Promise.all(
      permissionsData.map((p) => this.prisma.permission.upsert({ where: { key: p.key }, create: p, update: p })),
    );

    // 分配权限
    const rolePermissionsMap: Record<"ADMIN" | "AGENT" | "USER", string[]> = {
      ADMIN: [
        "ticket:list:any",
        "ticket:view:any",
        "ticket:create",
        "ticket:update:any",
        "ticket:close",
      ],

      AGENT: [
        "ticket:list:own",
        "ticket:view:own",
        "ticket:update:own",
      ],

      USER: [
        "ticket:list:own",
        "ticket:view:own",
        "ticket:create",
      ],
    };
    

    for (const [roleName, permKeys] of Object.entries(rolePermissionsMap)) {
      const role =
        roleName === "ADMIN"
          ? adminRole
          : roleName === "AGENT"
            ? agentRole
            : userRole;

      await Promise.all(
        permKeys.map((key) => {
          const perm = permissionRecords.find((p) => p.key === key)!;
          return this.prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: perm.id,
              },
            },
            create: {
              roleId: role.id,
              permissionId: perm.id,
            },
            update: {},
          });
        }),
      );
    }

    console.log("✅ Roles and permissions created");
    return { adminRole, agentRole, userRole };
  }
}
