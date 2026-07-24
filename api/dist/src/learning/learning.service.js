import { eventBus, LearningEvents } from '@hpbrain/events';
import { anonymize, generalize } from './anonymize.js';
/**
 * Learning Engine (Sprint 2 Story 8, extended Sprint 5 with Mental Model
 * reinforcement).
 * A successful outcome with reasonable confidence becomes reusable organizational
 * knowledge; a failed or low-confidence outcome is still recorded (the loop must
 * learn from failure too) but is not marked reusable, so it won't be surfaced as a
 * pattern to repeat.
 *
 * When reusable and a `domain` is given, the (anonymized, generalized) pattern
 * doesn't just sit in the append-only Learning ledger — it reinforces the
 * organization's Mental Model for that domain, closing the loop that Sprint 2's
 * graph relationships declared but never implemented.
 */
export class LearningService {
    repository;
    outcomeLookup;
    mentalModels;
    constructor(repository, outcomeLookup, mentalModels) {
        this.repository = repository;
        this.outcomeLookup = outcomeLookup;
        this.mentalModels = mentalModels;
    }
    async extract(input) {
        const outcome = await this.outcomeLookup.findById(input.tenantId, input.outcomeId);
        if (!outcome)
            throw new Error('outcome_not_found');
        const reusable = outcome.result === 'success' && outcome.confidence >= 0.5;
        // DPDP-compliant: strip identifiers and generalize named entities before a
        // pattern becomes permanent reusable organizational knowledge.
        const anonymizedPattern = anonymize(input.pattern);
        const generalizedPattern = generalize(anonymizedPattern.text);
        const anonymizedDescription = input.description ? anonymize(input.description).text : null;
        const totalRedactions = anonymizedPattern.redactionCount + generalizedPattern.redactionCount;
        let mentalModelId = input.mentalModelId ?? null;
        if (reusable && input.domain && this.mentalModels) {
            const model = await this.mentalModels.reinforceFromLearning(input.tenantId, input.domain, generalizedPattern.text, outcome.confidence, input.createdBy);
            mentalModelId = model.id;
        }
        const learning = await this.repository.create({
            tenantId: input.tenantId,
            outcomeId: outcome.id,
            mentalModelId,
            pattern: generalizedPattern.text,
            description: anonymizedDescription,
            confidence: outcome.confidence,
            reusable,
            createdBy: input.createdBy,
        });
        await eventBus.publish({
            type: LearningEvents.Extracted,
            tenantId: learning.tenantId,
            entityType: 'Learning',
            entityId: learning.id,
            actorId: input.createdBy,
            payload: { learning, outcome, redactionsApplied: totalRedactions },
        });
        return learning;
    }
    async list(tenantId) {
        return this.repository.list(tenantId);
    }
    async reusable(tenantId) {
        return this.repository.findReusable(tenantId);
    }
}
