import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LearningService } from '../src/learning/learning.service.js';
function createMockRepo() {
    const store = {};
    let nextId = 1;
    return {
        create: async (input) => {
            const id = `learn-${nextId++}`;
            const l = {
                id, tenantId: input.tenantId, outcomeId: input.outcomeId ?? null, mentalModelId: input.mentalModelId ?? null,
                pattern: input.pattern, description: input.description ?? null, confidence: input.confidence ?? 0.5,
                reusable: input.reusable ?? true, createdBy: input.createdBy, createdDate: new Date().toISOString(),
            };
            store[id] = l;
            return l;
        },
        list: async (tenantId) => Object.values(store).filter((l) => l.tenantId === tenantId),
        findReusable: async (tenantId) => Object.values(store).filter((l) => l.tenantId === tenantId && l.reusable),
    };
}
function mockOutcome(result, confidence) {
    return {
        id: 'out-1', tenantId: 't1', decisionId: 'dec-1', result, metrics: {}, kpis: {},
        evidenceIds: [], feedback: null, confidence, createdBy: 'u1', createdDate: new Date().toISOString(),
    };
}
test('LearningService.extract marks successful high-confidence outcomes reusable', async () => {
    const s = new LearningService(createMockRepo(), { findById: async () => mockOutcome('success', 0.8) });
    const learning = await s.extract({ tenantId: 't1', outcomeId: 'out-1', pattern: 'consultative bundling wins in mid-size territories', createdBy: 'u1' });
    assert.equal(learning.reusable, true);
    assert.equal(learning.confidence, 0.8);
});
test('LearningService.extract does not mark failed outcomes reusable', async () => {
    const s = new LearningService(createMockRepo(), { findById: async () => mockOutcome('failure', 0.8) });
    const learning = await s.extract({ tenantId: 't1', outcomeId: 'out-1', pattern: 'discount-led push underperformed', createdBy: 'u1' });
    assert.equal(learning.reusable, false);
});
test('LearningService.extract rejects unknown outcome', async () => {
    const s = new LearningService(createMockRepo(), { findById: async () => null });
    await assert.rejects(() => s.extract({ tenantId: 't1', outcomeId: 'nope', pattern: 'x', createdBy: 'u1' }));
});
