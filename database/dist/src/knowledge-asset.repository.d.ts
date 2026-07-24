export declare const KNOWLEDGE_CATEGORIES: readonly ["policy", "framework", "sop", "template", "playbook", "guideline", "best_practice", "case_study", "decision_model", "reasoning_model"];
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export interface KnowledgeAsset {
    id: string;
    tenantId: string;
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags: string[];
    confidence: number;
    departmentId: string | null;
    relatedPersonIds: string[];
    relatedCapabilityIds: string[];
    reuseCount: number;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateKnowledgeAssetInput {
    tenantId: string;
    title: string;
    category: KnowledgeCategory;
    content: string;
    tags?: string[];
    confidence?: number;
    departmentId?: string;
    relatedPersonIds?: string[];
    relatedCapabilityIds?: string[];
    createdBy: string;
}
export declare class KnowledgeAssetRepository {
    create(input: CreateKnowledgeAssetInput): Promise<KnowledgeAsset>;
    findById(tenantId: string, id: string): Promise<KnowledgeAsset | null>;
    list(tenantId: string, category?: KnowledgeCategory, departmentId?: string): Promise<KnowledgeAsset[]>;
    search(tenantId: string, query: string): Promise<KnowledgeAsset[]>;
    markReused(tenantId: string, id: string): Promise<KnowledgeAsset | null>;
    mostReused(tenantId: string, limit?: number): Promise<KnowledgeAsset[]>;
    private mapRow;
}
