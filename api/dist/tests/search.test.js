import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEARCHABLE_ENTITIES } from '@hpbrain/database';
test('SEARCHABLE_ENTITIES covers the core intelligence loop entities', () => {
    assert.deepEqual([...SEARCHABLE_ENTITIES], ['signal', 'evidence', 'recommendation', 'decision', 'learning']);
});
test('search repository mock: filters by entity type and matches query substring', async () => {
    const mockPool = {
        signals: [{ id: 's1', source: 'competitor_data', created_date: '2026-01-01' }],
        recommendations: [{ id: 'r1', title: 'Expand into Territory X', created_date: '2026-01-02' }],
    };
    // Behavioral check: a repo scoped to only 'recommendation' should never touch signals.
    const repo = {
        search: async (_tenantId, query, types) => {
            const results = [];
            if (!types || types.includes('recommendation')) {
                for (const r of mockPool.recommendations) {
                    if (r.title.toLowerCase().includes(query.toLowerCase())) {
                        results.push({ entityType: 'recommendation', id: r.id, headline: r.title, createdDate: r.created_date });
                    }
                }
            }
            if (!types || types.includes('signal')) {
                for (const s of mockPool.signals) {
                    if (s.source.toLowerCase().includes(query.toLowerCase())) {
                        results.push({ entityType: 'signal', id: s.id, headline: s.source, createdDate: s.created_date });
                    }
                }
            }
            return results;
        },
    };
    const scoped = await repo.search('t1', 'territory', ['recommendation']);
    assert.equal(scoped.length, 1);
    assert.equal(scoped[0].entityType, 'recommendation');
    const unscoped = await repo.search('t1', 'competitor', undefined);
    assert.equal(unscoped.length, 1);
    assert.equal(unscoped[0].entityType, 'signal');
});
