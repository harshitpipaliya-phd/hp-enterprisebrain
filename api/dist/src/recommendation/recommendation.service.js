import { eventBus, RecommendationEvents } from '@hpbrain/events';
const LOW_CONFIDENCE_THRESHOLD = 0.4;
/**
 * Recommendation Engine (Sprint 2 Story 4, extended Sprint 4 Story 4 with
 * urgency + expected ROI).
 * A recommendation's confidence is inherited from the ReasoningStep it's generated
 * from. Below the low-confidence threshold, the category is forced to 'watch'
 * regardless of what the caller requested — matching the agreed rule that
 * external-only, uncorroborated intelligence must never present as a firm claim.
 * Urgency is derived, not caller-supplied: a 'risk' category at high confidence is
 * urgent by nature; an 'opportunity' at the same confidence is not — a territory
 * expansion can wait a news cycle, an unresolved compliance risk cannot.
 */
export class RecommendationService {
    repository;
    reasoningLookup;
    constructor(repository, reasoningLookup) {
        this.repository = repository;
        this.reasoningLookup = reasoningLookup;
    }
    deriveUrgency(category, confidence) {
        if (category === 'compliance' && confidence >= 0.6)
            return 'immediate';
        if (category === 'risk' && confidence >= 0.7)
            return 'high';
        if (category === 'watch')
            return 'low';
        return confidence >= 0.7 ? 'high' : 'normal';
    }
    async generate(input) {
        const step = await this.reasoningLookup.findById(input.tenantId, input.reasoningStepId);
        if (!step)
            throw new Error('reasoning_step_not_found');
        const category = step.confidenceScore < LOW_CONFIDENCE_THRESHOLD ? 'watch' : input.category;
        const priority = step.confidenceScore >= 0.7 ? 'high' : step.confidenceScore >= 0.4 ? 'medium' : 'low';
        const urgency = this.deriveUrgency(category, step.confidenceScore);
        const recommendation = await this.repository.create({
            tenantId: input.tenantId,
            reasoningStepId: step.id,
            category,
            title: input.title,
            description: input.description ?? null,
            priority,
            urgency,
            confidence: step.confidenceScore,
            impact: input.impact ?? null,
            expectedRoi: input.expectedRoi ?? null,
            cost: input.cost ?? null,
            risk: input.risk ?? null,
            dependencies: input.dependencies ?? [],
            createdBy: input.createdBy,
        });
        await eventBus.publish({
            type: RecommendationEvents.Generated,
            tenantId: recommendation.tenantId,
            entityType: 'Recommendation',
            entityId: recommendation.id,
            actorId: input.createdBy,
            payload: { recommendation },
        });
        return recommendation;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, status) {
        return this.repository.list(tenantId, status);
    }
    async changeStatus(tenantId, id, status, actorId) {
        const updated = await this.repository.updateStatus(tenantId, id, status);
        if (!updated)
            return null;
        await eventBus.publish({
            type: RecommendationEvents.StatusChanged,
            tenantId: updated.tenantId,
            entityType: 'Recommendation',
            entityId: updated.id,
            actorId,
            payload: { recommendation: updated },
        });
        return updated;
    }
}
