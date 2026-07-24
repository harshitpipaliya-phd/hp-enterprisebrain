import type { StoredEvent, EventConsumer } from '../event.backbone.js';
import { sessionFor } from '../../neo4j/client.js';
import { BaseRepository } from '../../repository/base.js';

class GraphSyncNeo4jRepository extends BaseRepository {
  async syncNode(label: string, data: Record<string, unknown>): Promise<void> {
    const sets = Object.entries(data).map(([k, v]) => `n.${k} = $${k}`).join(', ');
    const cypher = `MERGE (n:${label} {id: $id, tenantId: $tenantId}) SET ${sets}, n.updatedDate = $updatedDate RETURN n`;
    await this.run(cypher, { ...data, updatedDate: new Date().toISOString() });
  }

  async archiveNode(label: string, id: string, tenantId: string): Promise<void> {
    const cypher = `MATCH (n:${label} {id: $id, tenantId: $tenantId}) SET n.status = 'archived', n.archivedDate = $archivedDate RETURN n`;
    await this.run(cypher, { id, tenantId, archivedDate: new Date().toISOString() });
  }

  async createRelationship(fromLabel: string, fromId: string, toLabel: string, toId: string, relType: string, tenantId: string): Promise<void> {
    const cypher = `
      MATCH (a:${fromLabel} {id: $fromId, tenantId: $tenantId})
      MATCH (b:${toLabel} {id: $toId, tenantId: $tenantId})
      MERGE (a)-[r:${relType}]->(b)
      RETURN r`;
    await this.run(cypher, { fromId, toId, tenantId });
  }
}

export class GraphSyncConsumer implements EventConsumer {
  name = 'GraphSyncConsumer';

  async consume(event: StoredEvent): Promise<void> {
    const session = sessionFor(event.tenantId);
    try {
      const repo = new GraphSyncNeo4jRepository(session);
      const payload = event.payload as Record<string, unknown>;
      const entity = this.extractEntity(payload);

      if (event.type.endsWith('Created') || event.type.endsWith('Updated')) {
        const label = this.getLabel(event.entityType);
        await repo.syncNode(label, { ...entity, tenantId: event.tenantId });

        if (event.entityType === 'Department' && entity.orgId) {
          await repo.createRelationship('Organization', entity.orgId as string, 'Department', entity.id as string, 'HAS_DEPARTMENT', event.tenantId);
        }
        if (event.entityType === 'Person' && entity.orgId) {
          await repo.createRelationship('Organization', entity.orgId as string, 'Person', entity.id as string, 'HAS_PERSON', event.tenantId);
        }
        if (event.entityType === 'Person' && entity.managerId) {
          await repo.createRelationship('Person', entity.managerId as string, 'Person', entity.id as string, 'REPORTS_TO', event.tenantId);
        }
        if (event.entityType === 'Person' && entity.departmentId) {
          await repo.createRelationship('Department', entity.departmentId as string, 'Person', entity.id as string, 'HAS_PERSON', event.tenantId);
        }
      } else if (event.type.endsWith('Archived')) {
        const label = this.getLabel(event.entityType);
        await repo.archiveNode(label, event.entityId, event.tenantId);
      }
    } finally {
      await session.close();
    }
  }

  private extractEntity(payload: Record<string, unknown>): Record<string, unknown> {
    for (const key of Object.keys(payload)) {
      const val = payload[key];
      if (val && typeof val === 'object' && !Array.isArray(val) && 'id' in (val as object)) {
        return val as Record<string, unknown>;
      }
    }
    return payload;
  }

  private getLabel(entityType: string): string {
    return entityType;
  }
}
