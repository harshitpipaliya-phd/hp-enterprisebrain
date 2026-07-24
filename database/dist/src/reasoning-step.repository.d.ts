export interface ReasoningStep {
    id: string;
    tenantId: string;
    caseId: string | null;
    signalId: string | null;
    mentalModelId: string | null;
    stepOrder: number;
    description: string;
    confidenceScore: number;
    createdBy: string;
    createdDate: string;
}
export interface CreateReasoningStepInput {
    tenantId: string;
    caseId?: string | null;
    signalId?: string | null;
    mentalModelId?: string | null;
    stepOrder: number;
    description: string;
    confidenceScore: number;
    createdBy: string;
}
export declare class ReasoningStepRepository {
    create(input: CreateReasoningStepInput): Promise<ReasoningStep>;
    findBySignal(tenantId: string, signalId: string): Promise<ReasoningStep[]>;
    findById(tenantId: string, id: string): Promise<ReasoningStep | null>;
    private mapRow;
}
