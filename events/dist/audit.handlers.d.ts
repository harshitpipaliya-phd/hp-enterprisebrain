import type { AuditLog } from '@hpbrain/database';
export declare function getOrganizationAuditLogs(tenantId: string, entityId: string): Promise<AuditLog[]>;
export declare function getDepartmentAuditLogs(tenantId: string, entityId: string): Promise<AuditLog[]>;
export declare function getPersonAuditLogs(tenantId: string, entityId: string): Promise<AuditLog[]>;
export declare function getCapabilityAuditLogs(tenantId: string, entityId: string): Promise<AuditLog[]>;
