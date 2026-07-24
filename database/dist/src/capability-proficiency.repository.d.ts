export interface CapabilityProficiency {
    id: string;
    tenantId: string;
    assignmentId: string;
    knowledgeLevel: number | null;
    abilityLevel: number | null;
    skillLevel: number | null;
    behaviourLevel: number | null;
    attitudeLevel: number | null;
    evidenceConfidence: number | null;
    assessedBy: string | null;
    assessedDate: string | null;
    createdDate: string;
}
export interface RecordProficiencyInput {
    tenantId: string;
    assignmentId: string;
    knowledgeLevel?: number;
    abilityLevel?: number;
    skillLevel?: number;
    behaviourLevel?: number;
    attitudeLevel?: number;
    evidenceConfidence?: number;
    assessedBy: string;
}
export declare class CapabilityProficiencyRepository {
    record(input: RecordProficiencyInput): Promise<CapabilityProficiency>;
    historyForAssignment(tenantId: string, assignmentId: string): Promise<CapabilityProficiency[]>;
    latestForAssignment(tenantId: string, assignmentId: string): Promise<CapabilityProficiency | null>;
    latestForAllAssignments(tenantId: string): Promise<CapabilityProficiency[]>;
    private mapRow;
}
