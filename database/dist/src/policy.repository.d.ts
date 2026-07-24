export declare const POLICY_TYPES: readonly ["executor_autonomy", "business_rule"];
export type PolicyType = (typeof POLICY_TYPES)[number];
export interface PolicyCondition {
    field: string;
    operator: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';
    value: unknown;
}
export interface PolicyRule {
    field?: string;
    operator?: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in';
    value?: unknown;
    conditions?: PolicyCondition[];
    match?: 'all' | 'any';
    action: string;
}
export interface Policy {
    id: string;
    tenantId: string;
    name: string;
    scope: string;
    policyType: PolicyType;
    allowedExecutorClasses: unknown[];
    trustLevels: unknown[];
    routingCriteria: Record<string, unknown>;
    escalationPath: unknown[];
    rules: PolicyRule[];
    version: number;
    previousVersionId: string | null;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreatePolicyInput {
    tenantId: string;
    name: string;
    scope: string;
    policyType: PolicyType;
    allowedExecutorClasses?: unknown[];
    trustLevels?: unknown[];
    routingCriteria?: Record<string, unknown>;
    escalationPath?: unknown[];
    rules?: PolicyRule[];
    createdBy: string;
}
export declare class PolicyRepository {
    create(input: CreatePolicyInput): Promise<Policy>;
    createVersion(tenantId: string, previousId: string, rules: PolicyRule[], createdBy: string): Promise<Policy>;
    findById(tenantId: string, id: string): Promise<Policy | null>;
    list(tenantId: string, policyType?: PolicyType): Promise<Policy[]>;
    history(tenantId: string, policyId: string): Promise<Policy[]>;
    private mapRow;
}
