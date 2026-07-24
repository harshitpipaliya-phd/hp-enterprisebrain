import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExecutorResolverService, DEFAULT_POLICY } from '../src/executor/executor-resolver.service.js';
import { DecisionService } from '../src/decision/decision.service.js';
function mockRec(overrides = {}) {
    return {
        id: 'rec-1', tenantId: 't1', reasoningStepId: 'rs-1', category: 'risk', title: 'x', description: null,
        priority: 'high', urgency: 'normal', confidence: 0.9, impact: null, expectedRoi: null, cost: null, risk: null, dependencies: [], status: 'pending',
        createdBy: 'u1', createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(), ...overrides,
    };
}
test('ExecutorResolver: opportunity category always routes to human', () => {
    const resolver = new ExecutorResolverService();
    const result = resolver.resolve(mockRec({ category: 'opportunity', confidence: 0.95 }));
    assert.equal(result.executorType, 'human');
});
test('ExecutorResolver: high-confidence risk routes to ai_agent under default policy', () => {
    const resolver = new ExecutorResolverService();
    const result = resolver.resolve(mockRec({ category: 'risk', confidence: 0.9 }), DEFAULT_POLICY);
    assert.equal(result.executorType, 'ai_agent');
});
test('ExecutorResolver: low-confidence risk falls back to human', () => {
    const resolver = new ExecutorResolverService();
    const result = resolver.resolve(mockRec({ category: 'risk', confidence: 0.2 }), DEFAULT_POLICY);
    assert.equal(result.executorType, 'human');
    assert.ok(result.alternativesConsidered.length > 0);
});
function createMockDecisionRepo() {
    const store = {};
    let nextId = 1;
    return {
        create: async (input) => {
            const id = `dec-${nextId++}`;
            const d = {
                id, tenantId: input.tenantId, recommendationId: input.recommendationId ?? null, decidedBy: input.decidedBy,
                executorType: input.executorType, rationale: input.rationale,
                alternativesConsidered: input.alternativesConsidered ?? [], confidence: input.confidence ?? 0.5, explanation: input.explanation ?? null, trace: input.trace ?? [], status: input.status ?? 'approved',
                createdDate: new Date().toISOString(),
            };
            store[id] = d;
            return d;
        },
        findById: async (_t, id) => store[id] ?? null,
        list: async (tenantId) => Object.values(store).filter((d) => d.tenantId === tenantId),
    };
}
test('DecisionService.approve resolves executor and marks recommendation approved', async () => {
    let recStatus = 'pending';
    const recLookup = {
        findById: async () => mockRec({ status: recStatus }),
        updateStatus: async (_t, _id, status) => { recStatus = status; return mockRec({ status }); },
    };
    const s = new DecisionService(createMockDecisionRepo(), recLookup);
    const decision = await s.approve({ tenantId: 't1', recommendationId: 'rec-1', decidedBy: 'u1', rationale: 'looks solid' });
    assert.equal(decision.executorType, 'ai_agent'); // mockRec defaults to risk/0.9
    assert.equal(recStatus, 'approved');
    assert.ok(decision.rationale.includes('looks solid'));
});
test('DecisionService.approve rejects unknown recommendation', async () => {
    const s = new DecisionService(createMockDecisionRepo(), { findById: async () => null, updateStatus: async () => null });
    await assert.rejects(() => s.approve({ tenantId: 't1', recommendationId: 'nope', decidedBy: 'u1', rationale: 'x' }));
});
