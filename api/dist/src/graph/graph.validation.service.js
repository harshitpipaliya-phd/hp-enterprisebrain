import { sessionFor } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
export class GraphValidationRepository extends BaseRepository {
    async checkNodeExists(label, id, tenantId) {
        const cypher = `MATCH (n:${label} {id: $id, tenantId: $tenantId}) RETURN count(n) as count`;
        const { records } = await this.run(cypher, { id, tenantId });
        return records.length > 0 && Number(records[0].count) > 0;
    }
    async checkTenantIsolation(tenantId) {
        const cypher = `MATCH (n) WHERE n.tenantId IS NOT NULL AND n.tenantId <> $tenantId RETURN count(n) as count`;
        const { records } = await this.run(cypher, { tenantId });
        const violations = records.length > 0 ? Number(records[0].count) : 0;
        return { passed: violations === 0, violations };
    }
    async checkOrphanNodes(tenantId) {
        const labels = ['Organization', 'Department', 'Person', 'Capability'];
        const orphans = [];
        for (const label of labels) {
            const cypher = `MATCH (n:${label} {tenantId: $tenantId}) WHERE NOT (n)--() RETURN n.id as id`;
            const { records } = await this.run(cypher, { tenantId });
            for (const record of records) {
                orphans.push({ label, id: record.id });
            }
        }
        return { passed: orphans.length === 0, orphans };
    }
    async checkRelationshipIntegrity(tenantId) {
        const cypher = `
      MATCH (n {tenantId: $tenantId})-[r]->(m)
      WHERE m IS NULL OR m.tenantId IS NULL
      RETURN id(n) as from, type(r) as type
    `;
        const { records } = await this.run(cypher, { tenantId });
        const broken = records.map((r) => ({ from: String(r.from), to: 'null', type: String(r.type) }));
        return { passed: broken.length === 0, broken };
    }
    async checkDuplicateNodes(label, tenantId) {
        const cypher = `
      MATCH (n:${label} {tenantId: $tenantId})
      WITH n.id as id, count(n) as cnt
      WHERE cnt > 1
      RETURN count(id) as duplicates
    `;
        const { records } = await this.run(cypher, { tenantId });
        const duplicates = records.length > 0 ? Number(records[0].duplicates) : 0;
        return { passed: duplicates === 0, duplicates };
    }
    async getStats(tenantId) {
        const nodeCypher = `MATCH (n {tenantId: $tenantId}) RETURN count(n) as count`;
        const relCypher = `MATCH (n {tenantId: $tenantId})-[r]->() RETURN count(r) as count`;
        const [nodeRecords, relRecords] = await Promise.all([
            this.run(nodeCypher, { tenantId }),
            this.run(relCypher, { tenantId }),
        ]);
        return {
            nodes: nodeRecords.records.length > 0 ? Number(nodeRecords.records[0].count) : 0,
            relationships: relRecords.records.length > 0 ? Number(relRecords.records[0].count) : 0,
        };
    }
}
export class GraphValidationService {
    sessionFactory;
    constructor(sessionFactory = sessionFor) {
        this.sessionFactory = sessionFactory;
    }
    async validate(tenantId) {
        const session = this.sessionFactory(tenantId);
        const checks = [];
        try {
            const repo = new GraphValidationRepository(session);
            // Check 1: Node existence for each label
            for (const label of ['Organization', 'Department', 'Person', 'Capability']) {
                const exists = await repo.checkNodeExists(label, 'any', tenantId);
                checks.push({
                    name: `${label} nodes exist`,
                    description: `Verify ${label} nodes exist for tenant ${tenantId}`,
                    passed: exists,
                });
            }
            // Check 2: Tenant isolation
            const isolation = await repo.checkTenantIsolation(tenantId);
            checks.push({
                name: 'Tenant isolation',
                description: 'Verify no cross-tenant node access',
                passed: isolation.passed,
                violations: isolation.violations > 0 ? [{ issue: `${isolation.violations} nodes from other tenants` }] : undefined,
            });
            // Check 3: Orphan nodes
            const orphans = await repo.checkOrphanNodes(tenantId);
            checks.push({
                name: 'No orphan nodes',
                description: 'Verify all nodes have at least one relationship',
                passed: orphans.passed,
                violations: orphans.orphans.map((o) => ({ label: o.label, id: o.id, issue: 'No relationships' })),
            });
            // Check 4: Relationship integrity
            const integrity = await repo.checkRelationshipIntegrity(tenantId);
            checks.push({
                name: 'Relationship integrity',
                description: 'Verify all relationships point to valid nodes',
                passed: integrity.passed,
                violations: integrity.broken.map((b) => ({ issue: `Broken ${b.type} from ${b.from}` })),
            });
            // Check 5: No duplicate nodes
            for (const label of ['Organization', 'Department', 'Person', 'Capability']) {
                const dupes = await repo.checkDuplicateNodes(label, tenantId);
                checks.push({
                    name: `No duplicate ${label} nodes`,
                    description: `Verify no duplicate ${label} nodes by id`,
                    passed: dupes.passed,
                    details: dupes.duplicates > 0 ? `${dupes.duplicates} duplicates found` : undefined,
                });
            }
        }
        finally {
            await session.close();
        }
        const passed = checks.filter((c) => c.passed).length;
        const failed = checks.filter((c) => !c.passed).length;
        return {
            passed: failed === 0,
            checks,
            summary: {
                totalChecks: checks.length,
                passed,
                failed,
            },
        };
    }
    async getStats(tenantId) {
        const session = this.sessionFactory(tenantId);
        try {
            const repo = new GraphValidationRepository(session);
            return await repo.getStats(tenantId);
        }
        finally {
            await session.close();
        }
    }
}
