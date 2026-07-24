import { eventBus, OrganizationEvents } from '@hpbrain/events';
export class OrganizationService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const org = await this.repository.create(input);
        await eventBus.publish({
            type: OrganizationEvents.Created,
            tenantId: org.tenantId,
            entityType: 'Organization',
            entityId: org.id,
            actorId: input.createdBy,
            payload: { actorName: input.createdBy, organization: org },
        });
        return org;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, status) {
        return this.repository.list(tenantId, status);
    }
    async update(tenantId, id, patch) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            return null;
        const updated = await this.repository.update(tenantId, id, patch);
        if (!updated)
            return null;
        const changes = {};
        for (const key of Object.keys({ ...existing, ...updated })) {
            if (existing[key] !== updated[key]) {
                changes[key] = { from: existing[key], to: updated[key] };
            }
        }
        await eventBus.publish({
            type: OrganizationEvents.Updated,
            tenantId: updated.tenantId,
            entityType: 'Organization',
            entityId: updated.id,
            actorId: 'system',
            payload: { actorName: 'system', changes, organization: updated },
        });
        return updated;
    }
    async archive(tenantId, id) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            return null;
        const archived = await this.repository.archive(tenantId, id);
        if (!archived)
            return null;
        await eventBus.publish({
            type: OrganizationEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Organization',
            entityId: archived.id,
            actorId: 'system',
            payload: { actorName: 'system', organization: archived },
        });
        return archived;
    }
}
