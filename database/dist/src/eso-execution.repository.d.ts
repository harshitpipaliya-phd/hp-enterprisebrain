export declare const ESO_EXECUTION_STATUSES: readonly ["queued", "running", "completed", "failed", "rolled_back"];
export type EsoExecutionStatus = (typeof ESO_EXECUTION_STATUSES)[number];
export interface EsoExecution {
    id: string;
    tenantId: string;
    esoId: string;
    decisionId: string | null;
    status: EsoExecutionStatus;
    executedBy: string;
    executorType: string;
    input: Record<string, unknown>;
    output: Record<string, unknown> | null;
    error: string | null;
    startedDate: string | null;
    completedDate: string | null;
    createdDate: string;
}
export interface QueueExecutionInput {
    tenantId: string;
    esoId: string;
    decisionId?: string | null;
    executedBy: string;
    executorType: string;
    input?: Record<string, unknown>;
}
export declare class EsoExecutionRepository {
    queue(input: QueueExecutionInput): Promise<EsoExecution>;
    findById(tenantId: string, id: string): Promise<EsoExecution | null>;
    findByEso(tenantId: string, esoId: string): Promise<EsoExecution[]>;
    list(tenantId: string, status?: EsoExecutionStatus): Promise<EsoExecution[]>;
    transition(tenantId: string, id: string, status: EsoExecutionStatus, patch?: {
        output?: Record<string, unknown>;
        error?: string;
    }): Promise<EsoExecution | null>;
    private mapRow;
    linkEvidence(tenantId: string, executionId: string, evidenceId: string): Promise<void>;
    getLinkedEvidenceIds(tenantId: string, executionId: string): Promise<string[]>;
}
