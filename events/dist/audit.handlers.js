import { eventBus, OrganizationEvents, DepartmentEvents, PersonEvents, ManagerChangedEvent, DepartmentAssignedEvent, CapabilityEvents } from './bus.js';
import { AuditRepository } from '@hpbrain/database';
const auditRepo = new AuditRepository();
async function handleAudit(event, action) {
    const changes = event.payload.changes ?? null;
    try {
        await auditRepo.create({
            tenantId: event.tenantId,
            entityType: event.entityType,
            entityId: event.entityId,
            action,
            actorId: event.actorId,
            actorName: String(event.payload.actorName ?? event.actorId),
            changes,
        });
    }
    catch {
        // best-effort
    }
}
export async function getOrganizationAuditLogs(tenantId, entityId) {
    return auditRepo.findByEntity(tenantId, 'Organization', entityId);
}
export async function getDepartmentAuditLogs(tenantId, entityId) {
    return auditRepo.findByEntity(tenantId, 'Department', entityId);
}
export async function getPersonAuditLogs(tenantId, entityId) {
    return auditRepo.findByEntity(tenantId, 'Person', entityId);
}
export async function getCapabilityAuditLogs(tenantId, entityId) {
    return auditRepo.findByEntity(tenantId, 'Capability', entityId);
}
// Organization handlers
eventBus.on(OrganizationEvents.Created, (e) => handleAudit(e, 'create'));
eventBus.on(OrganizationEvents.Updated, (e) => handleAudit(e, 'update'));
eventBus.on(OrganizationEvents.Archived, (e) => handleAudit(e, 'archive'));
// Department handlers
eventBus.on(DepartmentEvents.Created, (e) => handleAudit(e, 'create'));
eventBus.on(DepartmentEvents.Updated, (e) => handleAudit(e, 'update'));
eventBus.on(DepartmentEvents.Archived, (e) => handleAudit(e, 'archive'));
// Person handlers
eventBus.on(PersonEvents.Created, (e) => handleAudit(e, 'create'));
eventBus.on(PersonEvents.Updated, (e) => handleAudit(e, 'update'));
eventBus.on(PersonEvents.Archived, (e) => handleAudit(e, 'archive'));
// Manager change handler
eventBus.on(ManagerChangedEvent, (e) => handleAudit(e, 'manager_change'));
// Department assignment handler
eventBus.on(DepartmentAssignedEvent, (e) => handleAudit(e, 'department_assignment'));
// Capability handlers
eventBus.on(CapabilityEvents.Assigned, (e) => handleAudit(e, 'assign'));
eventBus.on(CapabilityEvents.Updated, (e) => handleAudit(e, 'update'));
eventBus.on(CapabilityEvents.Created, (e) => handleAudit(e, 'create'));
eventBus.on(CapabilityEvents.Archived, (e) => handleAudit(e, 'archive'));
eventBus.on(CapabilityEvents.VersionChanged, (e) => handleAudit(e, 'version_changed'));
