import { OpenAPIV3 } from 'openapi-types';
import { injectPermissions } from './openapi.inject.js';
import { TicketPermissionMatrix } from '@/modules/tickets/ticket.permissions.js';

export const openapi: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: { title: 'API', version: '1.0.0' },
  paths: {},
  components: {},
};


injectPermissions(openapi, {
  ticket: TicketPermissionMatrix,
  // user: UserPermissionMatrix,
  // role: RolePermissionMatrix,
});