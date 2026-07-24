export interface LogEntry {
    id: string;
    tenantId: string | null;
    orgId: string | null;
    level: string;
    message: string;
    module: string | null;
    userId: string | null;
    requestId: string | null;
    correlationId: string | null;
    executionTime: number | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}
export declare class LogsRepository {
    log(entry: Omit<LogEntry, 'id' | 'createdAt'>): Promise<LogEntry>;
    findByTenant(tenantId: string, level?: string, limit?: number): Promise<LogEntry[]>;
    findByCorrelationId(correlationId: string): Promise<LogEntry[]>;
    findByLevel(level: string, limit?: number): Promise<LogEntry[]>;
    countErrors(tenantId?: string): Promise<number>;
    private mapRow;
}
