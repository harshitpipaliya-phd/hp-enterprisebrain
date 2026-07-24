export declare const EXECUTOR_TYPES: readonly ["human", "ai_agent", "software", "hybrid"];
export type ExecutorType = (typeof EXECUTOR_TYPES)[number];
export interface DecisionTraceStep {
    step: string;
    detail: Record<string, unknown>;
}
export interface Decision {
    id: string;
    tenantId: string;
    recommendationId: string | null;
    decidedBy: string;
    executorType: ExecutorType;
    rationale: string;
    alternativesConsidered: unknown[];
    confidence: number;
    explanation: string | null;
    trace: DecisionTraceStep[];
    status: string;
    createdDate: string;
}
export interface CreateDecisionInput {
    tenantId: string;
    recommendationId?: string | null;
    decidedBy: string;
    executorType: ExecutorType;
    rationale: string;
    alternativesConsidered?: unknown[];
    confidence?: number;
    explanation?: string | null;
    trace?: DecisionTraceStep[];
    status?: string;
}
export declare class DecisionRepository {
    create(input: CreateDecisionInput): Promise<Decision>;
    findById(tenantId: string, id: string): Promise<Decision | null>;
    list(tenantId: string): Promise<Decision[]>;
    private mapRow;
}
