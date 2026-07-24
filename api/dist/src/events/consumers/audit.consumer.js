import { AuditRepository } from '@hpbrain/database';
export class AuditConsumer {
    name = 'AuditConsumer';
    auditRepo = new AuditRepository();
    async consume(event) {
        const action = this.mapAction(event.type);
        await this.auditRepo.create({
            tenantId: event.tenantId,
            entityType: event.entityType,
            entityId: event.entityId,
            action,
            actorId: event.actorId,
            actorName: String(event.payload.actorName ?? event.actorId),
            changes: event.payload.changes ?? null,
        });
    }
    mapAction(eventType) {
        if (eventType.endsWith('Created'))
            return 'create';
        if (eventType.endsWith('Updated'))
            return 'update';
        if (eventType.endsWith('Archived'))
            return 'archive';
        if (eventType.endsWith('Assigned'))
            return 'assign';
        if (eventType.endsWith('Changed'))
            return 'change';
        return eventType.toLowerCase();
    }
}
