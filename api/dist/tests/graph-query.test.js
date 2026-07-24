import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GraphQueryRepository } from '../src/graph-query/graph-query.repository.js';
function fakeSession(tenantId, rows = []) {
    const captured = [];
    const wrapped = rows.map((r) => ({ ...r, toObject: () => r }));
    const s = {
        tenantId,
        captured,
        run: async (cypher, params = {}) => {
            captured.push({ cypher, params });
            return { records: wrapped };
        },
        close: async () => { },
    };
    return s;
}
test('getEntity rejects an unknown label before touching Neo4j (the injection guard)', async () => {
    const session = fakeSession('t1');
    const repo = new GraphQueryRepository(session);
    await assert.rejects(() => repo.getEntity('Signal) DETACH DELETE n //', 'id-1'), /unknown_label/);
    assert.equal(session.captured.length, 0, 'no Cypher should run at all once the label fails validation');
});
test('getEntity runs a tenant-scoped query for a known label and returns the node', async () => {
    const session = fakeSession('t1', [{ labels: ['Case'], properties: { id: 'case-1', title: 'Test case' } }]);
    const repo = new GraphQueryRepository(session);
    const entity = await repo.getEntity('Case', 'case-1');
    assert.ok(entity);
    assert.equal(entity.properties.title, 'Test case');
    assert.match(session.captured[0].cypher, /tenantId/);
    assert.equal(session.captured[0].params.tenantId, 't1');
});
test('getEntity returns null when no matching node exists', async () => {
    const session = fakeSession('t1', []);
    const repo = new GraphQueryRepository(session);
    const entity = await repo.getEntity('Case', 'nonexistent');
    assert.equal(entity, null);
});
test('getRelated rejects an unknown label', async () => {
    const session = fakeSession('t1');
    const repo = new GraphQueryRepository(session);
    await assert.rejects(() => repo.getRelated('NotARealLabel', 'id-1'), /unknown_label/);
});
test('getRelated queries both directions and tags each result correctly', async () => {
    const session = fakeSession('t1', [{ relType: 'HAS_EVIDENCE', otherLabels: ['Evidence'], otherProps: { id: 'ev-1' } }]);
    const repo = new GraphQueryRepository(session);
    const related = await repo.getRelated('Case', 'case-1');
    assert.equal(related.length, 2);
    assert.ok(related.some((r) => r.direction === 'outgoing'));
    assert.ok(related.some((r) => r.direction === 'incoming'));
});
test('searchEntities rejects an unknown label in the filter list', async () => {
    const session = fakeSession('t1');
    const repo = new GraphQueryRepository(session);
    await assert.rejects(() => repo.searchEntities('test', ['Case', 'DROP TABLE users']), /unknown_label/);
});
test('searchEntities defaults to all known labels when none are specified', async () => {
    const session = fakeSession('t1', []);
    const repo = new GraphQueryRepository(session);
    await repo.searchEntities('fee collection', []);
    assert.match(session.captured[0].cypher, /n:Organization/, 'should search across all known labels by default');
});
test('searchEntities scopes the query to the tenant', async () => {
    const session = fakeSession('t1', []);
    const repo = new GraphQueryRepository(session);
    await repo.searchEntities('test', ['Case']);
    assert.equal(session.captured[0].params.tenantId, 't1');
    assert.equal(session.captured[0].params.query, 'test');
});
