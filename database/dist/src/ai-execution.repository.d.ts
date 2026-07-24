export interface AIExecution {
    id: string;
    tenantId: string;
    userId: string;
    serviceName: string;
    promptTemplateId: string | null;
    provider: string;
    model: string | null;
    status: 'success' | 'failed' | 'not_configured';
    inputTokens: number | null;
    outputTokens: number | null;
    latencyMs: number | null;
    estimatedCostUsd: number | null;
    error: string | null;
    entityType: string | null;
    entityId: string | null;
    createdDate: string;
}
export interface LogAIExecutionInput {
    tenantId: string;
    userId: string;
    serviceName: string;
    promptTemplateId?: string;
    provider: string;
    model?: string;
    status: 'success' | 'failed' | 'not_configured';
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    estimatedCostUsd?: number;
    error?: string;
    entityType?: string;
    entityId?: string;
}
export declare class AIExecutionRepository {
    log(input: LogAIExecutionInput): Promise<AIExecution>;
    list(tenantId: string, limit?: number): Promise<AIExecution[]>;
    private mapRow;
}
