import { PermissionToApiMap } from './permissions.openapi.js';

export function injectPermissions(openapi: any, matrixes: Record<string, Record<string, { any: string; own?: string }>>) {
  for (const [moduleName, matrix] of Object.entries(matrixes)) {
    for (const [action, rule] of Object.entries(matrix)) {
      const keys = [rule.any, ...(rule.own ? [rule.own] : [])];

      for (const key of keys) {
        const meta = PermissionToApiMap[key as keyof typeof PermissionToApiMap];
        if (!meta) continue;

        const path = meta.path.replace(':id', '{id}');
        const method = meta.method.toLowerCase();

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
}