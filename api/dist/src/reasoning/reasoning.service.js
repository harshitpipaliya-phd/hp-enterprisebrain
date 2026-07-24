import { eventBus, ReasoningEvents } from '@hpbrain/events';
import { computeFreshness } from '../evidence/evidence.service.js';
/**
 * Reasoning Engine (Sprint 2 Story 3).
 *
 * Confidence is not asserted — it's computed from how much Evidence corroborates the
 * Signal, per the agreed principle: "external data alone can produce intelligence, but
 * only as a low-confidence hypothesis; confidence scales with internal corroboration."
 *
 * Rule: base confidence 0.3 (a lone signal with no evidence is a weak hypothesis).
 * Each piece of evidence adds up to 0.15, weighted by that evidence's own confidence,
 * capped at 0.95 (reasoning is never fully certain — that's what Outcome capture is for).
 */
export class ReasoningService {
    repository;
    evidenceLookup;
    constructor(repository, evidenceLookup) {
        this.repository = repository;
        this.evidenceLookup = evidenceLookup;
    }
    /**
     * Sprint 4: corroboration weight is now confidence x freshness, not confidence
     * alone — stale evidence corroborates less, even at high stated confidence.
     */
    computeConfidence(evidence) {
        const base = 0.3;
        const corroboration = evidence.reduce((sum, e) => sum + e.confidence * computeFreshness(e.observedDate) * 0.15, 0);
        return Math.min(0.95, Number((base + corroboration).toFixed(2)));
    }
    async reason(input) {
        const evidence = await this.evidenceLookup.findBySignal(input.tenantId, input.signalId);
        const confidenceScore = this.computeConfidence(evidence);
        const existing = await this.repository.findBySignal(input.tenantId, input.signalId);
        const step = await this.repository.create({
            tenantId: input.tenantId,
            caseId: input.caseId ?? null,
            signalId: input.signalId,
            mentalModelId: input.mentalModelId ?? null,
            stepOrder: existing.length + 1,
            description: input.description,
            confidenceScore,
            createdBy: input.createdBy,
        });
        await eventBus.publish({
            type: ReasoningEvents.StepRecorded,
            tenantId: step.tenantId,
            entityType: 'ReasoningStep',
            entityId: step.id,
            actorId: input.createdBy,
            payload: { reasoningStep: step, evidenceCount: evidence.length },
        });
        return step;
    }
    async forSignal(tenantId, signalId) {
        return this.repository.findBySignal(tenantId, signalId);
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
}
