export declare const OUTCOME_RESULTS: readonly ["success", "failure", "partial", "pending"];
export type OutcomeResult = (typeof OUTCOME_RESULTS)[number];
export interface Outcome {
    id: string;
    tenantId: string;
    decisionId: string | null;
    result: OutcomeResult;
    metrics: Record<string, unknown>;
    kpis: Record<string, unknown>;
    evidenceIds: string[];
    feedback: string | null;
    confidence: number;
    createdBy: string;
    createdDate: string;
}
export interface CreateOutcomeInput {
    tenantId: string;
    decisionId?: string | null;
    result: OutcomeResult;
    metrics?: Record<string, unknown>;
    kpis?: Record<string, unknown>;
    evidenceIds?: string[];
    feedback?: string | null;
    confidence?: number;
    createdBy: string;
}
export declare class OutcomeRepository {
    create(input: CreateOutcomeInput): Promise<Outcome>;
    findById(tenantId: string, id: string): Promise<Outcome | null>;
    findByDecision(tenantId: string, decisionId: string): Promise<Outcome[]>;
    list(tenantId: string): Promise<Outcome[]>;
    private mapRow;
}
