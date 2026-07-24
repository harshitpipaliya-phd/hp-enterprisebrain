export interface Learning {
    id: string;
    tenantId: string;
    outcomeId: string | null;
    mentalModelId: string | null;
    pattern: string;
    description: string | null;
    confidence: number;
    reusable: boolean;
    createdBy: string;
    createdDate: string;
}
export interface CreateLearningInput {
    tenantId: string;
    outcomeId?: string | null;
    mentalModelId?: string | null;
    pattern: string;
    description?: string | null;
    confidence?: number;
    reusable?: boolean;
    createdBy: string;
}
export declare class LearningRepository {
    create(input: CreateLearningInput): Promise<Learning>;
    list(tenantId: string): Promise<Learning[]>;
    findReusable(tenantId: string): Promise<Learning[]>;
    private mapRow;
}
