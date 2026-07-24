import { sessionFor, type TenantSession } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';

export interface HealthStatus {
  connected: boolean;
  nodes: number;
  relationships: number;
  labels: string[];
  relationshipTypes: string[];
  constraints: number;
  indexes: number;
  errors: string[];
}

export class GraphHealthRepository extends BaseRepository {
  async isConnected(): Promise<boolean> {
    try {
      const cypher = `MATCH (n {tenantId: $tenantId}) RETURN count(n) as count`;
      await this.run(cypher, { tenantId: 'health-check' });
      return true;
    } catch {
      return false;
    }
  }

  async getNodeCount(tenantId: string): Promise<number> {
    const cypher = `MATCH (n {tenantId: $tenantId}) RETURN count(n) as count`;
    const { records } = await this.run(cypher, { tenantId });
    return records.length > 0 ? Number(records[0].count) : 0;
  }

  async getRelationshipCount(tenantId: string): Promise<number> {
    const cypher = `MATCH (n {tenantId: $tenantId})-[r]->() RETURN count(r) as count`;
    const { records } = await this.run(cypher, { tenantId });
    return records.length > 0 ? Number(records[0].count) : 0;
  }

  async getLabels(tenantId: string): Promise<string[]> {
    const cypher = `MATCH (n {tenantId: $tenantId}) RETURN DISTINCT labels(n) as labels`;
    const { records } = await this.run(cypher, { tenantId });
    const labels = new Set<string>();
    for (const record of records) {
      const lbls = record.labels as string[];
      for (const l of lbls) labels.add(l);
    }
    return Array.from(labels);
  }

  async getRelationshipTypes(tenantId: string): Promise<string[]> {
    const cypher = `MATCH (n {tenantId: $tenantId})-[r]->() RETURN DISTINCT type(r) as type`;
    const { records } = await this.run(cypher, { tenantId });
    return records.map((r) => String(r.type));
  }

  async getConstraintCount(): Promise<number> {
    const cypher = `SHOW CONSTRAINTS YIELD name RETURN count(name) as count`;
    try {
      const { records } = await this.run(cypher, { tenantId: 'health-check' });
      return records.length > 0 ? Number(records[0].count) : 0;
    } catch {
      return 0;
    }
  }

  async getIndexCount(): Promise<number> {
    const cypher = `SHOW INDEXES YIELD name RETURN count(name) as count`;
    try {
      const { records } = await this.run(cypher, { tenantId: 'health-check' });
      return records.length > 0 ? Number(records[0].count) : 0;
    } catch {
      return 0;
    }
  }
}

export class GraphHealthService {
  constructor(
    private readonly sessionFactory: (tenantId: string) => TenantSession = sessionFor,
  ) {}

  async check(tenantId: string): Promise<HealthStatus> {
    const session = this.sessionFactory(tenantId);
    const errors: string[] = [];

    try {
      const repo = new GraphHealthRepository(session);
      const connected = await repo.isConnected();
      if (!connected) {
        errors.push('Neo4j connection failed');
      }

      const [nodes, relationships, labels, relationshipTypes, constraints, indexes] = await Promise.all([
        repo.getNodeCount(tenantId),
        repo.getRelationshipCount(tenantId),
        repo.getLabels(tenantId),
        repo.getRelationshipTypes(tenantId),
        repo.getConstraintCount(),
        repo.getIndexCount(),
      ]);

      return {
        connected,
        nodes,
        relationships,
        labels,
        relationshipTypes,
        constraints,
        indexes,
        errors,
      };
    } catch (e: any) {
      errors.push(e.message);
      return {
        connected: false,
        nodes: 0,
        relationships: 0,
        labels: [],
        relationshipTypes: [],
        constraints: 0,
        indexes: 0,
        errors,
      };
    } finally {
      await session.close();
    }
  }
}
