import { eventBus, MentalModelEvents } from '@hpbrain/events';
/**
 * Mental Model Service (Sprint 5 — Enterprise Brain / Organizational Learning).
 *
 * This is the piece that was designed in Sprint 2 (the graph relationships
 * `(ReasoningStep)-[:APPLIES]->(MentalModel)` and `(Learning)-[:UPDATES]->(MentalModel)`
 * were declared then) but never implemented — MentalModel has had a table and a
 * graph constraint with nothing ever writing to them. This closes that loop: a
 * reusable Learning doesn't just sit in an append-only ledger, it accumulates into
 * an evolving organizational belief for its domain, which is what "the org gets
 * smarter over time" concretely means in this codebase, not a new abstraction.
 */
export class MentalModelService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Called by LearningService when a Learning is reusable. Finds the active
     * model for the domain and reinforces it, or creates the first one if this is
     * the domain's first reusable learning.
     */
    async reinforceFromLearning(tenantId, domain, pattern, confidence, actorId) {
        const existing = await this.repository.findActiveByDomain(tenantId, domain);
        if (existing) {
            const updated = await this.repository.reinforce(tenantId, existing.id, pattern, confidence);
            await eventBus.publish({
                type: MentalModelEvents.Reinforced,
                tenantId,
                entityType: 'MentalModel',
                entityId: updated.id,
                actorId,
                payload: { mentalModel: updated, pattern },
            });
            return updated;
        }
        const created = await this.repository.create({
            tenantId,
            name: `${domain} — organizational pattern`,
            domain,
            rules: { patterns: [pattern] },
            confidence,
            createdBy: actorId,
        });
        await eventBus.publish({
            type: MentalModelEvents.Created,
            tenantId,
            entityType: 'MentalModel',
            entityId: created.id,
            actorId,
            payload: { mentalModel: created },
        });
        return created;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async forDomain(tenantId, domain) {
        return this.repository.findActiveByDomain(tenantId, domain);
    }
    async list(tenantId) {
        return this.repository.list(tenantId);
    }
}
