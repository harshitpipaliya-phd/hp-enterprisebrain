import { eventBus, CapabilityEvents } from '@hpbrain/events';
export class CapabilityService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const existing = await this.repository.findByCode(input.tenantId, input.capabilityCode);
        if (existing) {
            throw new Error(`Capability with code ${input.capabilityCode} already exists`);
        }
        const capability = await this.repository.create(input);
        await eventBus.publish({
            type: CapabilityEvents.Created,
            tenantId: capability.tenantId,
            entityType: 'Capability',
            entityId: capability.id,
            actorId: input.createdBy,
            payload: { actorName: input.createdBy, capability },
        });
        return capability;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, orgId, status, category) {
        return this.repository.list(tenantId, orgId, status, category);
    }
    async search(tenantId, query, orgId) {
        return this.repository.search(tenantId, query, orgId);
    }
    async update(tenantId, id, patch) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            return null;
        if (patch.capabilityCode && patch.capabilityCode !== existing.capabilityCode) {
            const dup = await this.repository.findByCode(tenantId, patch.capabilityCode);
            if (dup)
                throw new Error(`Capability with code ${patch.capabilityCode} already exists`);
        }
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
            type: CapabilityEvents.Updated,
            tenantId: updated.tenantId,
            entityType: 'Capability',
            entityId: updated.id,
            actorId: 'system',
            payload: { actorName: 'system', changes, capability: updated },
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
            type: CapabilityEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Capability',
            entityId: archived.id,
            actorId: 'system',
            payload: { actorName: 'system', capability: archived },
        });
        return archived;
    }
    async createVersion(tenantId, id, createdBy) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            return null;
        await this.repository.snapshotVersion(existing, createdBy);
        const updated = await this.repository.update(tenantId, id, {});
        if (!updated)
            return null;
        await eventBus.publish({
            type: CapabilityEvents.VersionChanged,
            tenantId,
            entityType: 'Capability',
            entityId: id,
            actorId: createdBy,
            payload: { actorName: createdBy, capability: updated, version: (existing.version + 1) },
        });
        return updated;
    }
    async getVersions(tenantId, capabilityId) {
        return this.repository.getVersions(tenantId, capabilityId);
    }
    async assign(tenantId, capabilityId, targetType, targetId, assignedBy) {
        const assignment = await this.repository.upsertAssignment(tenantId, capabilityId, targetType, targetId, assignedBy);
        await eventBus.publish({
            type: CapabilityEvents.Assigned,
            tenantId,
            entityType: 'Capability',
            entityId: capabilityId,
            actorId: assignedBy,
            payload: { actorName: assignedBy, assignment, targetType, targetId },
        });
        return assignment;
    }
    async unassign(tenantId, capabilityId, targetType, targetId) {
        await this.repository.removeAssignment(tenantId, capabilityId, targetType, targetId);
    }
    async getAssignments(tenantId, capabilityId) {
        return this.repository.getAssignments(tenantId, capabilityId);
    }
}
