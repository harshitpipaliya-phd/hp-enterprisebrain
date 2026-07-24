import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RiskService } from '../src/risk/risk.service.js';
function createMockRepo() {
    const store = {};
    let nextId = 1;
    return {
        create: async (input) => {
            const id = `risk-${nextId++}`;
            const r = {
                id, tenantId: input.tenantId, decisionId: input.decisionId ?? null, recommendationId: input.recommendationId ?? null,
                category: input.category, probability: input.probability, impact: input.impact, score: input.score,
                mitigation: input.mitigation ?? null, status: 'open', createdBy: input.createdBy,
                createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
            };
            store[id] = r;
            return r;
        },
        findById: async (_t, id) => store[id] ?? null,
        findByDecision: async (t, decId) => Object.values(store).filter((r) => r.tenantId === t && r.decisionId === decId),
        list: async (t) => Object.values(store).filter((r) => r.tenantId === t),
        mitigate: async (_t, id, mitigation) => {
            const existing = store[id];
            if (!existing)
                return null;
            store[id] = { ...existing, status: 'mitigated', mitigation };
            return store[id];
        },
    };
}
test('RiskService.computeScore is deterministic (same inputs, same output)', () => {
    const s = new RiskService(createMockRepo());
    assert.equal(s.computeScore(0.5, 'medium'), 1.25);
    assert.equal(s.computeScore(0.5, 'medium'), s.computeScore(0.5, 'medium'));
});
test('RiskService.computeScore ranks critical impact higher than low at equal probability', () => {
    const s = new RiskService(createMockRepo());
    assert.ok(s.computeScore(0.5, 'critical') > s.computeScore(0.5, 'low'));
});
test('RiskService.assess persists a computed score, not a caller-supplied one', async () => {
    const s = new RiskService(createMockRepo());
    const risk = await s.assess({ tenantId: 't1', category: 'compliance', probability: 0.8, impact: 'high', createdBy: 'u1' });
    assert.equal(risk.score, 4); // 0.8 * 5
    assert.equal(risk.status, 'open');
});
test('RiskService.mitigate sets status to mitigated', async () => {
    const s = new RiskService(createMockRepo());
    const risk = await s.assess({ tenantId: 't1', category: 'operational', probability: 0.3, impact: 'low', createdBy: 'u1' });
    const mitigated = await s.mitigate('t1', risk.id, 'Added manual review step', 'u2');
    assert.equal(mitigated.status, 'mitigated');
    assert.equal(mitigated.mitigation, 'Added manual review step');
});
