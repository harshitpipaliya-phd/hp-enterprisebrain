export interface AccreditationFramework {
    id: string;
    tenantId: string;
    name: string;
    cycleLabel: string | null;
}
export interface AccreditationCriterion {
    id: string;
    tenantId: string;
    frameworkId: string;
    criterionCode: string;
    description: string;
    status: string;
}
export declare class AccreditationRepository {
    createFramework(tenantId: string, name: string, cycleLabel: string | undefined, createdBy: string): Promise<AccreditationFramework>;
    listFrameworks(tenantId: string): Promise<AccreditationFramework[]>;
    createCriterion(tenantId: string, frameworkId: string, criterionCode: string, description: string, createdBy: string): Promise<AccreditationCriterion>;
    listCriteria(tenantId: string, frameworkId: string): Promise<AccreditationCriterion[]>;
    linkEvidence(tenantId: string, criterionId: string, evidenceId: string): Promise<void>;
    getLinkedEvidenceCount(tenantId: string, criterionId: string): Promise<number>;
    setStatus(tenantId: string, criterionId: string, status: string): Promise<AccreditationCriterion | null>;
    private mapFramework;
    private mapCriterion;
}
