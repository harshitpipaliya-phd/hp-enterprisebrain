export interface HealthCheck {
    id: string;
    checkName: string;
    status: string;
    details: Record<string, unknown> | null;
    responseTime: number | null;
    checkedAt: string;
}
export declare class HealthCheckRepository {
    record(checkName: string, status: string, details?: Record<string, unknown>, responseTime?: number): Promise<HealthCheck>;
    getLatest(checkName: string): Promise<HealthCheck | null>;
    getHistory(checkName: string, limit?: number): Promise<HealthCheck[]>;
    getSummary(): Promise<Record<string, {
        status: string;
        lastChecked: string;
        responseTime: number | null;
    }>>;
    private mapRow;
}
