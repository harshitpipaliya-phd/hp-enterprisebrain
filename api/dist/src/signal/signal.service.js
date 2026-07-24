import { eventBus, SignalEvents } from '@hpbrain/events';
/**
 * Signal Intelligence Engine (Sprint 2 Story 1).
 * A Signal is a raw, unverified observation surfaced from a connector. It does not
 * carry proof on its own — Evidence collection (Story 2) is what substantiates it.
 * Detecting a signal always emits SignalEvents.Detected so downstream consumers
 * (evidence collection, graph sync) can react without polling.
 */
export class SignalService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async detect(input) {
        const signal = await this.repository.create(input);
        await eventBus.publish({
            type: SignalEvents.Detected,
            tenantId: signal.tenantId,
            entityType: 'Signal',
            entityId: signal.id,
            actorId: input.createdBy,
            payload: { signal },
        });
        return signal;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, orgId, status, source) {
        return this.repository.list(tenantId, orgId, status, source);
    }
    async changeStatus(tenantId, id, status, actorId) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            return null;
        const updated = await this.repository.updateStatus(tenantId, id, { status });
        if (!updated)
            return null;
        await eventBus.publish({
            type: SignalEvents.StatusChanged,
            tenantId: updated.tenantId,
            entityType: 'Signal',
            entityId: updated.id,
            actorId,
            payload: { from: existing.status, to: updated.status, signal: updated },
        });
        return updated;
    }
}
