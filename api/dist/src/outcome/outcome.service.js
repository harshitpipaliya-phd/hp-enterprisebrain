import { eventBus, OutcomeEvents } from '@hpbrain/events';
/** Outcome Engine (Sprint 2 Story 7). Append-only capture of what actually happened. */
export class OutcomeService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async capture(input) {
        const outcome = await this.repository.create(input);
        await eventBus.publish({
            type: OutcomeEvents.Captured,
            tenantId: outcome.tenantId,
            entityType: 'Outcome',
            entityId: outcome.id,
            actorId: input.createdBy,
            payload: { outcome },
        });
        return outcome;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async forDecision(tenantId, decisionId) {
        return this.repository.findByDecision(tenantId, decisionId);
    }
    async list(tenantId) {
        return this.repository.list(tenantId);
    }
}
