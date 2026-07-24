import { eventBus, PersonEvents, ManagerChangedEvent, DepartmentAssignedEvent } from '@hpbrain/events';
export class PersonService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        const existing = await this.repository.findByEmployeeId(input.tenantId, input.employeeId);
        if (existing) {
            throw new Error(`Person with employeeId ${input.employeeId} already exists`);
        }
        const emailExisting = await this.repository.findByEmail(input.tenantId, input.email);
        if (emailExisting) {
            throw new Error(`Person with email ${input.email} already exists`);
        }
        const person = await this.repository.create(input);
        await eventBus.publish({
            type: PersonEvents.Created,
            tenantId: person.tenantId,
            entityType: 'Person',
            entityId: person.id,
            actorId: input.createdBy,
            payload: { actorName: input.createdBy, person },
        });
        return person;
    }
    async get(tenantId, id) {
        return this.repository.findById(tenantId, id);
    }
    async list(tenantId, orgId, status, departmentId) {
        return this.repository.list(tenantId, orgId, status, departmentId);
    }
    async search(tenantId, query, orgId) {
        return this.repository.search(tenantId, query, orgId);
    }
    async update(tenantId, id, patch) {
        const existing = await this.repository.findById(tenantId, id);
        if (!existing)
            return null;
        if (patch.employeeId && patch.employeeId !== existing.employeeId) {
            const dup = await this.repository.findByEmployeeId(tenantId, patch.employeeId);
            if (dup)
                throw new Error(`Person with employeeId ${patch.employeeId} already exists`);
        }
        if (patch.email && patch.email !== existing.email) {
            const dup = await this.repository.findByEmail(tenantId, patch.email);
            if (dup)
                throw new Error(`Person with email ${patch.email} already exists`);
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
            type: PersonEvents.Updated,
            tenantId: updated.tenantId,
            entityType: 'Person',
            entityId: updated.id,
            actorId: 'system',
            payload: { actorName: 'system', changes, person: updated },
        });
        if (patch.managerId !== undefined && patch.managerId !== existing.managerId) {
            await eventBus.publish({
                type: ManagerChangedEvent,
                tenantId: updated.tenantId,
                entityType: 'Person',
                entityId: updated.id,
                actorId: 'system',
                payload: { actorName: 'system', person: updated, previousManagerId: existing.managerId, newManagerId: patch.managerId },
            });
        }
        if (patch.departmentId !== undefined && patch.departmentId !== existing.departmentId) {
            await eventBus.publish({
                type: DepartmentAssignedEvent,
                tenantId: updated.tenantId,
                entityType: 'Person',
                entityId: updated.id,
                actorId: 'system',
                payload: { actorName: 'system', person: updated, previousDepartmentId: existing.departmentId, newDepartmentId: patch.departmentId },
            });
        }
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
            type: PersonEvents.Archived,
            tenantId: archived.tenantId,
            entityType: 'Person',
            entityId: archived.id,
            actorId: 'system',
            payload: { actorName: 'system', person: archived },
        });
        return archived;
    }
}
