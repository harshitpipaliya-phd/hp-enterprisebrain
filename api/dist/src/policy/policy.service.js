import { eventBus, PolicyEvents } from '@hpbrain/events';
/**
 * Safely reads a dot-path (e.g. "recommendation.category") out of a plain object.
 * No eval, no Function constructor — just property traversal.
 */
function getPath(context, path) {
    return path.split('.').reduce((acc, key) => {
        if (acc && typeof acc === 'object' && key in acc) {
            return acc[key];
        }
        return undefined;
    }, context);
}
function evaluateCondition(condition, context) {
    const actual = getPath(context, condition.field);
    switch (condition.operator) {
        case 'eq': return actual === condition.value;
        case 'neq': return actual !== condition.value;
        case 'gte': return typeof actual === 'number' && typeof condition.value === 'number' && actual >= condition.value;
        case 'lte': return typeof actual === 'number' && typeof condition.value === 'number' && actual <= condition.value;
        case 'gt': return typeof actual === 'number' && typeof condition.value === 'number' && actual > condition.value;
        case 'lt': return typeof actual === 'number' && typeof condition.value === 'number' && actual < condition.value;
        case 'in': return Array.isArray(condition.value) && condition.value.includes(actual);
        default: return false;
    }
}
function evaluateRule(rule, context) {
    // Composite form: AND/OR across multiple conditions (Sprint 8).
    if (rule.conditions && rule.conditions.length > 0) {
        const results = rule.conditions.map((c) => evaluateCondition(c, context));
        return rule.match === 'any' ? results.some(Boolean) : results.every(Boolean); // default 'all'
    }
    // Flat form (Sprint 4, unchanged) — single field/operator/value on the rule itself.
    if (rule.field && rule.operator) {
        return evaluateCondition({ field: rule.field, operator: rule.operator, value: rule.value }, context);
    }
    return false;
}
export function evaluatePolicy(policy, context) {
    const matched = policy.rules.filter((rule) => evaluateRule(rule, context));
    return { matched, actions: matched.map((r) => r.action) };
}
/**
 * Policy Engine (Sprint 4 Story 5). Extends the existing `Policy` entity (added
 * Sprint 2 for executor autonomy) with business-rule evaluation and versioning —
 * one entity, two uses, not a duplicate table.
 */
export class PolicyService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const policy = await this.repository.create(input);
        await eventBus.publish({
            type: PolicyEvents.Created,
            tenantId: policy.tenantId,
            entityType: 'Policy',
            entityId: policy.id,
            actorId: input.createdBy,
            payload: { policy },
        });
        return policy;
    }
    async createVersion(tenantId, previousId, rules, actorId) {
        const policy = await this.repository.createVersion(tenantId, previousId, rules, actorId);
        await eventBus.publish({
            type: PolicyEvents.VersionCreated,
            tenantId: policy.tenantId,
            entityType: 'Policy',
            entityId: policy.id,
            actorId,
            payload: { policy, previousVersionId: previousId },
        });
        return policy;
    }
    /** Evaluates every rule in a business_rule policy against a context object. */
    evaluate(policy, context) {
        return evaluatePolicy(policy, context);
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, policyType) {
        return this.repository.list(tenantId, policyType);
    }
    async history(tenantId, policyId) {
        return this.repository.history(tenantId, policyId);
    }
}
