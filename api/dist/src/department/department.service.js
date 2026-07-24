import { eventBus, DepartmentEvents } from '@hpbrain/events';
export class DepartmentService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const dept = await this.repository.create(input);
        await eventBus.publish({
            type: DepartmentEvents.Created,
            tenantId: dept.tenantId,
            entityType: 'Department',
            entityId: dept.id,
            actorId: input.createdBy,
            payload: { actorName: input.createdBy, department: dept },
        });
        return dept;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, orgId, status) {
        return this.repository.list(tenantId, orgId, status);
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
            type: DepartmentEvents.Updated,
            tenantId: updated.tenantId,
            entityType: 'Department',
            entityId: updated.id,
            actorId: 'system',
            payload: { actorName: 'system', changes, department: updated },
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
            type: DepartmentEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Department',
            entityId: archived.id,
            actorId: 'system',
            payload: { actorName: 'system', department: archived },
        });
        return archived;
    }
}
