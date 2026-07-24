import { sessionFor } from '../../neo4j/client.js';
import { BaseRepository } from '../../repository/base.js';
class GraphSyncNeo4jRepository extends BaseRepository {
    async syncNode(label, data) {
        const sets = Object.entries(data).map(([k, v]) => `n.${k} = $${k}`).join(', ');
        const cypher = `MERGE (n:${label} {id: $id, tenantId: $tenantId}) SET ${sets}, n.updatedDate = $updatedDate RETURN n`;
        await this.run(cypher, { ...data, updatedDate: new Date().toISOString() });
    }
    async archiveNode(label, id, tenantId) {
        const cypher = `MATCH (n:${label} {id: $id, tenantId: $tenantId}) SET n.status = 'archived', n.archivedDate = $archivedDate RETURN n`;
        await this.run(cypher, { id, tenantId, archivedDate: new Date().toISOString() });
    }
    async createRelationship(fromLabel, fromId, toLabel, toId, relType, tenantId) {
        const cypher = `
      MATCH (a:${fromLabel} {id: $fromId, tenantId: $tenantId})
      MATCH (b:${toLabel} {id: $toId, tenantId: $tenantId})
      MERGE (a)-[r:${relType}]->(b)
      RETURN r`;
        await this.run(cypher, { fromId, toId, tenantId });
    }
}
export class GraphSyncConsumer {
    name = 'GraphSyncConsumer';
    async consume(event) {
        const session = sessionFor(event.tenantId);
        try {
            const repo = new GraphSyncNeo4jRepository(session);
            const payload = event.payload;
            const entity = this.extractEntity(payload);
            if (event.type.endsWith('Created') || event.type.endsWith('Updated')) {
                const label = this.getLabel(event.entityType);
                await repo.syncNode(label, { ...entity, tenantId: event.tenantId });
                if (event.entityType === 'Department' && entity.orgId) {
                    await repo.createRelationship('Organization', entity.orgId, 'Department', entity.id, 'HAS_DEPARTMENT', event.tenantId);
                }
                if (event.entityType === 'Person' && entity.orgId) {
                    await repo.createRelationship('Organization', entity.orgId, 'Person', entity.id, 'HAS_PERSON', event.tenantId);
                }
                if (event.entityType === 'Person' && entity.managerId) {
                    await repo.createRelationship('Person', entity.managerId, 'Person', entity.id, 'REPORTS_TO', event.tenantId);
                }
                if (event.entityType === 'Person' && entity.departmentId) {
                    await repo.createRelationship('Department', entity.departmentId, 'Person', entity.id, 'HAS_PERSON', event.tenantId);
                }
            }
            else if (event.type.endsWith('Archived')) {
                const label = this.getLabel(event.entityType);
                await repo.archiveNode(label, event.entityId, event.tenantId);
            }
        }
        finally {
            await session.close();
        }
    }
    extractEntity(payload) {
        for (const key of Object.keys(payload)) {
            const val = payload[key];
            if (val && typeof val === 'object' && !Array.isArray(val) && 'id' in val) {
                return val;
            }
        }
        return payload;
    }
    getLabel(entityType) {
        return entityType;
    }
}
