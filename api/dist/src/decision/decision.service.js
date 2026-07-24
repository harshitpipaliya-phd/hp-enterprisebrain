import { eventBus, DecisionEvents } from '@hpbrain/events';
import { ExecutorResolverService, DEFAULT_POLICY } from '../executor/executor-resolver.service.js';
import { evaluatePolicy } from '../policy/policy.service.js';
/**
 * Decision service (Sprint 2 Story 6, paired with ExecutorResolverService).
 * Approving a recommendation resolves its executor and produces an immutable
 * Decision record — the rationale + alternatives-considered trail the earlier
 * Fee Intelligence loop-closure design called for.
 */
export class DecisionService {
    repository;
    recommendations;
    resolver;
    policies;
    constructor(repository, recommendations, resolver = new ExecutorResolverService(), policies) {
        this.repository = repository;
        this.recommendations = recommendations;
        this.resolver = resolver;
        this.policies = policies;
    }
    /**
     * Sprint 6: Autonomous Decision Execution.
     *
     * This does not invent a new autonomy model — it wires the Policy Engine's
     * `evaluate()` method (built Sprint 4, never called by anything except its own
     * manual API route) into the actual Recommendation -> Decision flow. A tenant
     * must explicitly create an active `business_rule` policy with an `auto_approve`
     * action for this to do anything at all — opt-in, not a default behavior change.
     *
     * Hard safety rule, not policy-overridable: `opportunity` category recommendations
     * are NEVER auto-approved, full stop, matching the existing principle enforced at
     * the executor-resolution layer ("the system proposes, it does not decide
     * strategic direction"). A policy author cannot write a rule that bypasses this —
     * the check happens before any policy is even evaluated.
     */
    async tryAutoApprove(tenantId, recommendationId) {
        if (!this.policies)
            return null;
        const recommendation = await this.recommendations.findById(tenantId, recommendationId);
        if (!recommendation || recommendation.status !== 'pending')
            return null;
        if (recommendation.category === 'opportunity')
            return null; // hard rule, no policy can override this
        const activePolicies = (await this.policies.list(tenantId, 'business_rule')).filter((p) => p.status === 'active');
        for (const policy of activePolicies) {
            const result = evaluatePolicy(policy, { recommendation });
            if (result.actions.includes('auto_approve')) {
                return this.approve({
                    tenantId,
                    recommendationId,
                    decidedBy: 'system:policy-engine',
                    rationale: `Auto-approved by policy "${policy.name}" (v${policy.version}): matched ${result.matched.length} rule(s).`,
                });
            }
        }
        return null;
    }
    async approve(input) {
        const recommendation = await this.recommendations.findById(input.tenantId, input.recommendationId);
        if (!recommendation)
            throw new Error('recommendation_not_found');
        const resolution = this.resolver.resolve(recommendation, input.policy ?? DEFAULT_POLICY);
        // Sprint 4 Story 1: an explainable decision needs a trace of what fed into it
        // (not just a free-text rationale), plus a human-readable summary auto-built
        // from that trace so a non-technical reviewer can see *why* without reading
        // the alternatives-considered JSON.
        const trace = [
            { step: 'recommendation', detail: { id: recommendation.id, category: recommendation.category, confidence: recommendation.confidence } },
            { step: 'executor_resolution', detail: { resolved: resolution.executorType, rationale: resolution.rationale, alternativesRejected: resolution.alternativesConsidered.length } },
        ];
        const explanation = `Approved a ${recommendation.category} recommendation ("${recommendation.title}") at ${Math.round(recommendation.confidence * 100)}% confidence. ${resolution.rationale}`;
        const decision = await this.repository.create({
            tenantId: input.tenantId,
            recommendationId: recommendation.id,
            decidedBy: input.decidedBy,
            executorType: resolution.executorType,
            rationale: `${input.rationale} | Executor resolution: ${resolution.rationale}`,
            alternativesConsidered: resolution.alternativesConsidered,
            confidence: recommendation.confidence,
            explanation,
            trace,
            status: 'approved',
        });
        await this.recommendations.updateStatus(input.tenantId, recommendation.id, 'approved');
        await eventBus.publish({
            type: DecisionEvents.Made,
            tenantId: decision.tenantId,
            entityType: 'Decision',
            entityId: decision.id,
            actorId: input.decidedBy,
            payload: { decision, recommendation },
        });
        return decision;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    /**
     * Rejects a recommendation without creating an execution-bound Decision — no
     * executor is resolved since nothing will run. Still records who rejected it and
     * why, for the same audit trail reasons approval gets one.
     */
    async reject(input) {
        const recommendation = await this.recommendations.findById(input.tenantId, input.recommendationId);
        if (!recommendation)
            throw new Error('recommendation_not_found');
        const decision = await this.repository.create({
            tenantId: input.tenantId,
            recommendationId: recommendation.id,
            decidedBy: input.decidedBy,
            executorType: 'human',
            rationale: input.rationale,
            alternativesConsidered: [],
            confidence: recommendation.confidence,
            explanation: `Rejected a ${recommendation.category} recommendation ("${recommendation.title}"): ${input.rationale}`,
            trace: [{ step: 'recommendation', detail: { id: recommendation.id, category: recommendation.category, confidence: recommendation.confidence } }],
            status: 'rejected',
        });
        await this.recommendations.updateStatus(input.tenantId, recommendation.id, 'rejected');
        await eventBus.publish({
            type: DecisionEvents.Made,
            tenantId: decision.tenantId,
            entityType: 'Decision',
            entityId: decision.id,
            actorId: input.decidedBy,
            payload: { decision, recommendation },
        });
        return decision;
    }
    async list(tenantId) {
        return this.repository.list(tenantId);
    }
}
