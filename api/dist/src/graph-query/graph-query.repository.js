import { BaseRepository } from '../repository/base.js';
// Every node label this repository, or any part of this codebase, actually
// creates — same list graph.sync.service.ts tracks. Cypher does not support
// parameterized labels (`{label: $label}` is not valid Cypher), so any label
// used to build a query string MUST be checked against this allowlist first,
// or a caller could inject arbitrary Cypher via a crafted label string.
const KNOWN_LABELS = new Set([
    'Organization', 'Department', 'Person', 'Capability', 'Signal', 'Evidence',
    'ReasoningStep', 'Recommendation', 'Decision', 'Outcome', 'Learning',
    'Executor', 'Policy', 'Risk', 'MentalModel', 'Case', 'Hypothesis',
]);
function assertKnownLabel(label) {
    if (!KNOWN_LABELS.has(label)) {
        throw new Error(`unknown_label: "${label}" is not a recognized graph node label`);
    }
}
/**
 * Graph Query API (Sprint 8, scoped). Not the full "Knowledge Graph Explorer"
 * — no visualization UI, no search indexing/ranking, no saved searches. What
 * this actually is: the retrieval layer Brain Console will need later
 * ("natural-language Q&A over the tenant graph with citations" — §12.2), and
 * the Node Details / related-entity lookups EPIC-004's Case exploration
 * genuinely needs right now. Built narrow and real rather than broad and
 * speculative.
 */
export class GraphQueryRepository extends BaseRepository {
    async getEntity(label, id) {
        assertKnownLabel(label);
        const cypher = `MATCH (n:${label} {id: $id, tenantId: $tenantId}) RETURN labels(n) AS labels, properties(n) AS properties`;
        const result = await this.run(cypher, { id, tenantId: this.tenantId });
        if (result.records.length === 0)
            return null;
        const row = result.records[0];
        return { labels: row.labels, properties: row.properties };
    }
    /**
     * Relationship browser / related-entity suggestions: every node directly
     * connected to this one, in either direction, with the relationship type
     * — capped at 50 so one heavily-connected node can't return an unbounded
     * result set.
     */
    async getRelated(label, id, limit = 50) {
        assertKnownLabel(label);
        const outgoingCypher = `
      MATCH (n:${label} {id: $id, tenantId: $tenantId})-[r]->(other)
      WHERE other.tenantId = $tenantId
      RETURN type(r) AS relType, labels(other) AS otherLabels, properties(other) AS otherProps
      LIMIT $limit`;
        const incomingCypher = `
      MATCH (n:${label} {id: $id, tenantId: $tenantId})<-[r]-(other)
      WHERE other.tenantId = $tenantId
      RETURN type(r) AS relType, labels(other) AS otherLabels, properties(other) AS otherProps
      LIMIT $limit`;
        const [outgoing, incoming] = await Promise.all([
            this.run(outgoingCypher, { id, tenantId: this.tenantId, limit }),
            this.run(incomingCypher, { id, tenantId: this.tenantId, limit }),
        ]);
        const toRel = (records, direction) => records.map((row) => ({
            type: String(row.relType),
            direction,
            otherNode: { labels: row.otherLabels, properties: row.otherProps },
        }));
        return [...toRel(outgoing.records, 'outgoing'), ...toRel(incoming.records, 'incoming')];
    }
    /**
     * Enterprise Search — real, but simple: a case-insensitive substring match
     * across common name/title/statement properties for the given labels. Not
     * a separate search index with ranking; Neo4j's own property lookup,
     * honest about what it is rather than dressed up as more.
     */
    async searchEntities(query, labels, limit = 20) {
        const targetLabels = labels.length > 0 ? labels : [...KNOWN_LABELS];
        targetLabels.forEach(assertKnownLabel);
        const labelFilter = targetLabels.map((l) => `n:${l}`).join(' OR ');
        const cypher = `
      MATCH (n {tenantId: $tenantId})
      WHERE (${labelFilter})
        AND (
          toLower(coalesce(n.name, '')) CONTAINS toLower($query)
          OR toLower(coalesce(n.title, '')) CONTAINS toLower($query)
          OR toLower(coalesce(n.statement, '')) CONTAINS toLower($query)
        )
      RETURN labels(n) AS labels, properties(n) AS properties
      LIMIT $limit`;
        const result = await this.run(cypher, { query, tenantId: this.tenantId, limit });
        return result.records.map((row) => ({ labels: row.labels, properties: row.properties }));
    }
}
