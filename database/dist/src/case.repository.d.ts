export declare const CASE_STATUSES: readonly ["open", "investigating", "hypothesized", "resolved", "closed"];
export type CaseStatus = (typeof CASE_STATUSES)[number];
export interface Case {
    id: string;
    tenantId: string;
    signalId: string | null;
    title: string;
    description: string | null;
    status: CaseStatus;
    resolvedHypothesisId: string | null;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateCaseInput {
    tenantId: string;
    signalId?: string | null;
    title: string;
    description?: string | null;
    createdBy: string;
}
export declare class CaseRepository {
    create(input: CreateCaseInput): Promise<Case>;
    findById(tenantId: string, id: string): Promise<Case | null>;
    findBySignal(tenantId: string, signalId: string): Promise<Case[]>;
    list(tenantId: string, status?: CaseStatus): Promise<Case[]>;
    transition(tenantId: string, id: string, status: CaseStatus, resolvedHypothesisId?: string | null): Promise<Case | null>;
    linkEvidence(tenantId: string, caseId: string, evidenceId: string): Promise<void>;
    getLinkedEvidenceIds(tenantId: string, caseId: string): Promise<string[]>;
    private mapRow;
}
