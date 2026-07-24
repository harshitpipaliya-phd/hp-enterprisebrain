export interface MentalModel {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    domain: string;
    rules: Record<string, unknown>;
    confidence: number;
    reinforcementCount: number;
    version: number;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateMentalModelInput {
    tenantId: string;
    name: string;
    description?: string | null;
    domain: string;
    rules?: Record<string, unknown>;
    confidence?: number;
    createdBy: string;
}
export declare class MentalModelRepository {
    create(input: CreateMentalModelInput): Promise<MentalModel>;
    findById(tenantId: string, id: string): Promise<MentalModel | null>;
    findActiveByDomain(tenantId: string, domain: string): Promise<MentalModel | null>;
    list(tenantId: string): Promise<MentalModel[]>;
    reinforce(tenantId: string, id: string, pattern: string, newConfidence: number): Promise<MentalModel>;
    private mapRow;
}
