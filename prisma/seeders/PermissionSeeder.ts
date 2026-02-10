import { PermissionToApiMap } from "../../src/docs/permissions.openapi.js";
import { BaseSeeder } from "./BaseSeeder.js";

export class PermissionSeeder extends BaseSeeder {
  async run() {
    for (const [key, meta] of Object.entries(PermissionToApiMap)) {
      const [resource, action, scope] = key.split(':');

      await this.prisma.permission.upsert({
        where: { key },
        update: {
          resource,
          action,
          scope: scope ?? null,
          description: meta.description,
        },
        create: {
          key,
          resource,
          action,
          scope: scope ?? null,
          description: meta.description,
        },
      });
    }

    console.log("✅ Permissions created");
    return;
  }
}