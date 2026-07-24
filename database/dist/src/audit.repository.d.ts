export interface AuditLog {
    id: string;
    tenantId: string;
    orgId?: string;
    entityType: string;
    entityId: string;
    action: string;
    actorId: string;
    actorName: string;
    changes: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    eventId?: string;
    source?: string;
    executionTime?: number;
    status?: string;
    requestId?: string;
    createdAt: string;
}
export declare class AuditRepository {
    create(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
    findByEntity(tenantId: string, entityType: string, entityId: string): Promise<AuditLog[]>;
    findByTenant(tenantId: string, limit?: number): Promise<AuditLog[]>;
    findByCorrelationId(correlationId: string): Promise<AuditLog[]>;
    findByEventId(eventId: string): Promise<AuditLog[]>;
    search(tenantId: string, query: string, limit?: number): Promise<AuditLog[]>;
    count(tenantId?: string): Promise<number>;
    countByAction(tenantId: string): Promise<Record<string, number>>;
    getActivityTimeline(tenantId: string, limit?: number): Promise<AuditLog[]>;
    private mapRow;
}
