"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationAuditLogs = getOrganizationAuditLogs;
const index_js_1 = require("../events/index.js");
const audit_repository_js_1 = require("../../database/src/audit.repository.js");
const auditRepo = new audit_repository_js_1.AuditRepository();
async function handleOrganizationEvent(event) {
    let action = '';
    if (event.type === index_js_1.OrganizationEvents.Created)
        action = 'create';
    else if (event.type === index_js_1.OrganizationEvents.Updated)
        action = 'update';
    else if (event.type === index_js_1.OrganizationEvents.Archived)
        action = 'archive';
    else
        return;
    const changes = event.payload.changes ?? null;
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
index_js_1.eventBus.on(index_js_1.OrganizationEvents.Created, handleOrganizationEvent);
index_js_1.eventBus.on(index_js_1.OrganizationEvents.Updated, handleOrganizationEvent);
index_js_1.eventBus.on(index_js_1.OrganizationEvents.Archived, handleOrganizationEvent);
async function getOrganizationAuditLogs(tenantId, entityId) {
    return auditRepo.findByEntity(tenantId, 'Organization', entityId);
}
