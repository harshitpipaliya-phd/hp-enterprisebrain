import { eventBus, CaseEvents } from '@hpbrain/events';
// EPIC-004 F-004.4: open -> investigating -> hypothesized -> resolved -> closed.
const VALID_TRANSITIONS = {
    open: ['investigating'],
    investigating: ['hypothesized'],
    hypothesized: ['investigating', 'resolved'], // can return to investigating if a hypothesis is rejected and a new one is needed
    resolved: ['closed'],
    closed: [],
};
/**
 * Case Engine (EPIC-004). "A signal alone is not actionable" — the epic's own
 * business problem statement. This is the investigative thread: a case opens
 * from a signal, moves through hypothesis formation (HypothesisService owns
 * that ledger), and closes only once a hypothesis is confirmed and linked.
 */
export class CaseService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async open(input) {
        const created = await this.repository.create(input);
        await eventBus.publish({
            type: CaseEvents.Opened,
            tenantId: created.tenantId,
            entityType: 'Case',
            entityId: created.id,
            actorId: input.createdBy,
            payload: { case: created },
        });
        return created;
    }
    async transition(tenantId, id, status, actorId, resolvedHypothesisId) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            throw new Error('case_not_found');
        if (!VALID_TRANSITIONS[existing.status].includes(status)) {
            throw new Error(`invalid_transition: ${existing.status} -> ${status}`);
        }
        if (status === 'resolved' && !resolvedHypothesisId) {
            throw new Error('resolved_requires_hypothesis');
        }
        const updated = await this.repository.transition(tenantId, id, status, resolvedHypothesisId ?? null);
        if (!updated)
            throw new Error('case_not_found');
        await eventBus.publish({
            type: CaseEvents.StatusChanged,
            tenantId: updated.tenantId,
            entityType: 'Case',
            entityId: updated.id,
            actorId,
            payload: { from: existing.status, to: updated.status, case: updated },
        });
        return updated;
    }
    async attachEvidence(tenantId, caseId, evidenceId, actorId) {
        const existing = await this.repository.findById(tenantId, caseId);
        if (!existing)
            throw new Error('case_not_found');
        await this.repository.linkEvidence(tenantId, caseId, evidenceId);
        await eventBus.publish({
            type: CaseEvents.EvidenceLinked,
            tenantId,
            entityType: 'Case',
            entityId: caseId,
            actorId,
            payload: { evidenceId },
        });
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async forSignal(tenantId, signalId) {
        return this.repository.findBySignal(tenantId, signalId);
    }
    async list(tenantId, status) {
        return this.repository.list(tenantId, status);
    }
    async linkedEvidence(tenantId, caseId) {
        return this.repository.getLinkedEvidenceIds(tenantId, caseId);
    }
}
