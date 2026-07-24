export declare const RECOMMENDATION_CATEGORIES: readonly ["risk", "opportunity", "watch", "compliance"];
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];
export interface Recommendation {
    id: string;
    tenantId: string;
    reasoningStepId: string | null;
    category: RecommendationCategory;
    title: string;
    description: string | null;
    priority: string;
    urgency: string;
    confidence: number;
    impact: string | null;
    expectedRoi: number | null;
    cost: string | null;
    risk: string | null;
    dependencies: unknown[];
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateRecommendationInput {
    tenantId: string;
    reasoningStepId?: string | null;
    category: RecommendationCategory;
    title: string;
    description?: string | null;
    urgency?: string;
    expectedRoi?: number | null;
    priority?: string;
    confidence: number;
    impact?: string | null;
    cost?: string | null;
    risk?: string | null;
    dependencies?: unknown[];
    createdBy: string;
}
export declare class RecommendationRepository {
    create(input: CreateRecommendationInput): Promise<Recommendation>;
    findById(tenantId: string, id: string): Promise<Recommendation | null>;
    list(tenantId: string, status?: string): Promise<Recommendation[]>;
    updateStatus(tenantId: string, id: string, status: string): Promise<Recommendation | null>;
    private mapRow;
}
