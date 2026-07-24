import type { AuditLog } from '../../database/src/audit.repository.js';
export declare function getOrganizationAuditLogs(tenantId: string, entityId: string): Promise<AuditLog[]>;
