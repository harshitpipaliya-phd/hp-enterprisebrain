export interface CareerCluster {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    description: string | null;
}
export interface Occupation {
    id: string;
    tenantId: string;
    clusterId: string | null;
    occupationCode: string;
    title: string;
    description: string | null;
}
export interface OccupationRequirement {
    occupationId: string;
    capabilityId: string;
    requiredLevel: number;
}
export declare class CareerRepository {
    createCluster(tenantId: string, code: string, name: string, description: string | undefined, createdBy: string): Promise<CareerCluster>;
    listClusters(tenantId: string): Promise<CareerCluster[]>;
    createOccupation(tenantId: string, clusterId: string | undefined, occupationCode: string, title: string, description: string | undefined, createdBy: string): Promise<Occupation>;
    listOccupations(tenantId: string, clusterId?: string): Promise<Occupation[]>;
    setRequirement(tenantId: string, occupationId: string, capabilityId: string, requiredLevel: number): Promise<void>;
    getRequirements(tenantId: string, occupationId: string): Promise<OccupationRequirement[]>;
    private mapCluster;
    private mapOccupation;
}
