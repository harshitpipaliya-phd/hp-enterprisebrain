import { sessionFor } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
export class GraphHealthRepository extends BaseRepository {
    async isConnected() {
        try {
            const cypher = `MATCH (n {tenantId: $tenantId}) RETURN count(n) as count`;
            await this.run(cypher, { tenantId: 'health-check' });
            return true;
        }
        catch {
            return false;
        }
    }
    async getNodeCount(tenantId) {
        const cypher = `MATCH (n {tenantId: $tenantId}) RETURN count(n) as count`;
        const { records } = await this.run(cypher, { tenantId });
        return records.length > 0 ? Number(records[0].count) : 0;
    }
    async getRelationshipCount(tenantId) {
        const cypher = `MATCH (n {tenantId: $tenantId})-[r]->() RETURN count(r) as count`;
        const { records } = await this.run(cypher, { tenantId });
        return records.length > 0 ? Number(records[0].count) : 0;
    }
    async getLabels(tenantId) {
        const cypher = `MATCH (n {tenantId: $tenantId}) RETURN DISTINCT labels(n) as labels`;
        const { records } = await this.run(cypher, { tenantId });
        const labels = new Set();
        for (const record of records) {
            const lbls = record.labels;
            for (const l of lbls)
                labels.add(l);
        }
        return Array.from(labels);
    }
    async getRelationshipTypes(tenantId) {
        const cypher = `MATCH (n {tenantId: $tenantId})-[r]->() RETURN DISTINCT type(r) as type`;
        const { records } = await this.run(cypher, { tenantId });
        return records.map((r) => String(r.type));
    }
    async getConstraintCount() {
        const cypher = `SHOW CONSTRAINTS YIELD name RETURN count(name) as count`;
        try {
            const { records } = await this.run(cypher, { tenantId: 'health-check' });
            return records.length > 0 ? Number(records[0].count) : 0;
        }
        catch {
            return 0;
        }
    }
    async getIndexCount() {
        const cypher = `SHOW INDEXES YIELD name RETURN count(name) as count`;
        try {
            const { records } = await this.run(cypher, { tenantId: 'health-check' });
            return records.length > 0 ? Number(records[0].count) : 0;
        }
        catch {
            return 0;
        }
    }
}
export class GraphHealthService {
    sessionFactory;
    constructor(sessionFactory = sessionFor) {
        this.sessionFactory = sessionFactory;
    }
    async check(tenantId) {
        const session = this.sessionFactory(tenantId);
        const errors = [];
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
        }
        catch (e) {
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
        }
        finally {
            await session.close();
        }
    }
}
