export interface Metric {
    id: string;
    tenantId: string | null;
    metricName: string;
    metricValue: number;
    tags: Record<string, unknown> | null;
    recordedAt: string;
}
export declare class MetricsRepository {
    record(tenantId: string | null, metricName: string, metricValue: number, tags?: Record<string, unknown>): Promise<Metric>;
    findByTenant(tenantId: string, metricName?: string, limit?: number): Promise<Metric[]>;
    getAggregates(tenantId: string, metricName: string): Promise<{
        avg: number;
        min: number;
        max: number;
        count: number;
    }>;
    private mapRow;
}
