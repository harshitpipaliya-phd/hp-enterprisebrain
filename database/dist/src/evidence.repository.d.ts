export interface Evidence {
    id: string;
    tenantId: string;
    signalId: string | null;
    source: string;
    evidenceType: string;
    content: Record<string, unknown>;
    provenance: Record<string, unknown>;
    confidence: number;
    hash: string;
    version: number;
    status: string;
    observedDate: string;
    createdBy: string;
    createdDate: string;
}
export interface CreateEvidenceInput {
    tenantId: string;
    signalId?: string | null;
    source: string;
    evidenceType?: string;
    content: Record<string, unknown>;
    provenance: Record<string, unknown>;
    confidence?: number;
    observedDate?: string;
    createdBy: string;
}
export declare class EvidenceRepository {
    create(input: CreateEvidenceInput): Promise<Evidence>;
    findById(tenantId: string, id: string): Promise<Evidence | null>;
    findBySignal(tenantId: string, signalId: string): Promise<Evidence[]>;
    list(tenantId: string, source?: string): Promise<Evidence[]>;
    private mapRow;
}
