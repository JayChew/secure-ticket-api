// src/modules/tickets/ticket.openapi.ts
import { TicketPermissionMatrix } from './ticket.permissions.js';
import type { PermissionKey } from '@/docs/permissions.openapi.js';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

export async function injectTicketPermissions(openapi: any) {
  for (const [action, rule] of Object.entries(TicketPermissionMatrix)) {
    const keys: PermissionKey[] = [rule.any, ...(rule.own ? [rule.own] : [])];

    for (const key of keys) {
      const meta = (await import('@/docs/permissions.openapi.js')).PermissionToApiMap[key];
      if (!meta) continue;

      const path = meta.path.replace(':id', '{id}');
      const method: HttpMethod = meta.method.toLowerCase() as HttpMethod;

      openapi.paths[path] ??= {};
      openapi.paths[path][method] ??= {};

      openapi.paths[path][method]['x-permissions'] = keys;

      openapi.paths[path][method].responses ??= {};
      openapi.paths[path][method].responses['403'] = {
        description: `Missing permission: ${keys.join(', ')}`,
      };

      openapi.paths[path][method].summary = meta.description;
    }
  }
}
