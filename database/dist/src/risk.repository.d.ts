export declare const RISK_CATEGORIES: readonly ["operational", "financial", "compliance", "reputational", "strategic"];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export declare const RISK_IMPACTS: readonly ["low", "medium", "high", "critical"];
export type RiskImpact = (typeof RISK_IMPACTS)[number];
export declare const RISK_STATUSES: readonly ["open", "mitigated", "accepted", "realized"];
export type RiskStatus = (typeof RISK_STATUSES)[number];
export interface Risk {
    id: string;
    tenantId: string;
    decisionId: string | null;
    recommendationId: string | null;
    category: RiskCategory;
    probability: number;
    impact: RiskImpact;
    score: number;
    mitigation: string | null;
    status: RiskStatus;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateRiskInput {
    tenantId: string;
    decisionId?: string | null;
    recommendationId?: string | null;
    category: RiskCategory;
    probability: number;
    impact: RiskImpact;
    mitigation?: string | null;
    createdBy: string;
}
export declare class RiskRepository {
    create(input: CreateRiskInput & {
        score: number;
    }): Promise<Risk>;
    findById(tenantId: string, id: string): Promise<Risk | null>;
    findByDecision(tenantId: string, decisionId: string): Promise<Risk[]>;
    list(tenantId: string, status?: RiskStatus): Promise<Risk[]>;
    mitigate(tenantId: string, id: string, mitigation: string): Promise<Risk | null>;
    private mapRow;
}
