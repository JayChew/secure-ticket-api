// src/docs/permissions.openapi.ts
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export const PermissionToApiMap = {
  // Ticket
  'ticket:view:any': {
    method: 'GET',
    path: '/tickets/:id',
    resource: 'ticket',
    action: 'view',
    scope: 'any',
    description: 'View any ticket',
  },
  'ticket:view:own': {
    method: 'GET',
    path: '/tickets/:id',
    resource: 'ticket',
    action: 'view',
    scope: 'own',
    description: 'View own ticket',
  },
  'ticket:create': {
    method: 'POST',
    path: '/tickets',
    resource: 'ticket',
    action: 'create',
    description: 'Create ticket',
  },
  'ticket:update': {
    method: 'PATCH',
    path: '/tickets/:id',
    resource: 'ticket',
    action: 'update',
    description: 'Update ticket',
  },
  'ticket:close': {
    method: 'PATCH',
    path: '/tickets/:id',
    resource: 'ticket',
    action: 'close',
    description: 'Close ticket',
  },
  'auth:user:update': {
    method: 'PATCH',
    path: '/users/:id',
    resource: 'user',
    action: 'update',
    description: 'Update user',
  },
  'auth:session:create': {
    method: 'POST',
    path: '/sessions',
    resource: 'session',
    action: 'create',
    description: 'Create session',
  },
  'auth:session:revoke': {
    method: 'DELETE',
    path: '/sessions/:id',
    resource: 'session',
    action: 'revoke',
    description: 'Revoke session',
  },
  'auth:session:view:any': {
    method: 'GET',
    path: '/sessions/:id',
    resource: 'session',
    action: 'view',
    scope: 'any',
    description: 'View any session',
  },
  'auth:session:view:own': {
    method: 'GET',
    path: '/sessions/:id',
    resource: 'session',
    action: 'view',
    scope: 'own',
    description: 'View own session',
  },
} as const;

export type PermissionKey = keyof typeof PermissionToApiMap;
