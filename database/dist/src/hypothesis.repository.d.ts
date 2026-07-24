import type { RootCauseFamily } from '@hpbrain/contracts';
export declare const HYPOTHESIS_STATUSES: readonly ["proposed", "supported", "rejected", "confirmed"];
export type HypothesisStatus = (typeof HYPOTHESIS_STATUSES)[number];
export interface Hypothesis {
    id: string;
    tenantId: string;
    caseId: string;
    statement: string;
    rootCauseFamily: RootCauseFamily;
    confidence: number;
    status: HypothesisStatus;
    supportingEvidenceIds: string[];
    rejectedReason: string | null;
    proposedBy: string;
    createdDate: string;
}
export interface ProposeHypothesisInput {
    tenantId: string;
    caseId: string;
    statement: string;
    rootCauseFamily: RootCauseFamily;
    confidence?: number;
    supportingEvidenceIds?: string[];
    proposedBy: string;
}
export declare class HypothesisRepository {
    propose(input: ProposeHypothesisInput): Promise<Hypothesis>;
    recordOutcome(tenantId: string, caseId: string, originalHypothesisId: string, status: 'supported' | 'rejected' | 'confirmed', proposedBy: string, rejectedReason?: string, additionalEvidenceIds?: string[]): Promise<Hypothesis>;
    findById(tenantId: string, id: string): Promise<Hypothesis | null>;
    findByCase(tenantId: string, caseId: string): Promise<Hypothesis[]>;
    private mapRow;
}
