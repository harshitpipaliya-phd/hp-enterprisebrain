export interface KasbaElement {
    description?: string;
    level?: number;
    weight?: number;
    evidenceRequired?: boolean;
    measurementMethod?: string;
    targetLevel?: number;
    currentLevel?: number;
}
export interface Capability {
    id: string;
    tenantId: string;
    orgId: string;
    capabilityCode: string;
    name: string;
    description: string | null;
    category: string;
    capabilityType: string;
    difficulty: string;
    criticality: string;
    version: number;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
    knowledge: KasbaElement | null;
    ability: KasbaElement | null;
    skill: KasbaElement | null;
    behaviour: KasbaElement | null;
    attitude: KasbaElement | null;
}
export interface CreateCapabilityInput {
    tenantId: string;
    orgId: string;
    capabilityCode: string;
    name: string;
    description?: string | null;
    category?: string;
    capabilityType?: string;
    difficulty?: string;
    criticality?: string;
    createdBy: string;
    knowledge?: KasbaElement | null;
    ability?: KasbaElement | null;
    skill?: KasbaElement | null;
    behaviour?: KasbaElement | null;
    attitude?: KasbaElement | null;
}
export interface UpdateCapabilityInput {
    name?: string;
    description?: string | null;
    category?: string;
    capabilityType?: string;
    difficulty?: string;
    criticality?: string;
    status?: string;
    knowledge?: KasbaElement | null;
    ability?: KasbaElement | null;
    skill?: KasbaElement | null;
    behaviour?: KasbaElement | null;
    attitude?: KasbaElement | null;
}
export interface CapabilityAssignment {
    id: string;
    tenantId: string;
    capabilityId: string;
    targetType: string;
    targetId: string;
    assignedBy: string;
    assignedDate: string;
    status: string;
}
export declare class CapabilityRepository {
    create(input: CreateCapabilityInput): Promise<Capability>;
    findById(tenantId: string, id: string): Promise<Capability | null>;
    findByCode(tenantId: string, capabilityCode: string): Promise<Capability | null>;
    list(tenantId: string, orgId?: string, status?: string, category?: string): Promise<Capability[]>;
    search(tenantId: string, query: string, orgId?: string): Promise<Capability[]>;
    update(tenantId: string, id: string, patch: UpdateCapabilityInput): Promise<Capability | null>;
    archive(tenantId: string, id: string): Promise<Capability | null>;
    snapshotVersion(capability: Capability, createdBy: string): Promise<void>;
    getVersions(tenantId: string, capabilityId: string): Promise<Array<{
        version: number;
        name: string;
        createdDate: string;
    }>>;
    upsertAssignment(tenantId: string, capabilityId: string, targetType: string, targetId: string, assignedBy: string): Promise<CapabilityAssignment>;
    removeAssignment(tenantId: string, capabilityId: string, targetType: string, targetId: string): Promise<void>;
    getAssignments(tenantId: string, capabilityId: string): Promise<CapabilityAssignment[]>;
    getAssignmentsForTarget(tenantId: string, targetType: string, targetId: string): Promise<CapabilityAssignment[]>;
    listAllAssignments(tenantId: string): Promise<CapabilityAssignment[]>;
    private mapAssignment;
    private mapRow;
}
