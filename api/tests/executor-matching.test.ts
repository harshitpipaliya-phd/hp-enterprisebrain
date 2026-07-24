import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExecutorResolverService } from '../src/executor/executor-resolver.service.js';
import { DecisionService } from '../src/decision/decision.service.js';
import type { Recommendation, Executor, Decision, CreateDecisionInput } from '@hpbrain/database';

function mockRec(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'rec-1', tenantId: 't1', reasoningStepId: 'rs-1', category: 'risk', title: 'x', description: null,
    priority: 'high', urgency: 'normal', confidence: 0.9, impact: null, expectedRoi: null, cost: null, risk: null, dependencies: [], status: 'pending',
    createdBy: 'u1', createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(), ...overrides,
  };
}

function mockExecutor(overrides: Partial<Executor> = {}): Executor {
  return {
    id: 'exec-1', tenantId: 't1', executorType: 'ai_agent', name: 'Collections Agent',
    personId: null, capabilityTags: ['fee_collection'], trustLevel: 0.9, maxConcurrent: 5,
    currentWorkload: 1, available: true, status: 'active',
    createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(), ...overrides,
  };
}

test('ExecutorResolver.matchExecutor finds a capable, available executor', async () => {
  const directory = { findAvailable: async () => [mockExecutor()] };
  const resolver = new ExecutorResolverService(directory);
  const match = await resolver.matchExecutor('t1', mockRec({ category: 'risk', confidence: 0.9 }), 'fee_collection');
  assert.equal(match.matchedExecutor?.name, 'Collections Agent');
});

test('ExecutorResolver.matchExecutor falls back to human when resolved class has no availability', async () => {
  const directory = {
    findAvailable: async (_t: string, type: string) => (type === 'human' ? [mockExecutor({ executorType: 'human', name: 'Priya (Ops)' })] : []),
  };
  const resolver = new ExecutorResolverService(directory);
  const match = await resolver.matchExecutor('t1', mockRec({ category: 'risk', confidence: 0.9 }), 'fee_collection');
  assert.equal(match.executorType, 'human');
  assert.equal(match.matchedExecutor?.name, 'Priya (Ops)');
});

test('ExecutorResolver.matchExecutor reports no match when nothing is available anywhere', async () => {
  const directory = { findAvailable: async () => [] };
  const resolver = new ExecutorResolverService(directory);
  const match = await resolver.matchExecutor('t1', mockRec({ category: 'risk', confidence: 0.9 }), 'fee_collection');
  assert.equal(match.matchedExecutor, null);
});

test('ExecutorResolver.matchExecutor throws without a directory configured', async () => {
  const resolver = new ExecutorResolverService();
  await assert.rejects(() => resolver.matchExecutor('t1', mockRec()));
});

function createMockDecisionRepo() {
  const store: Record<string, Decision> = {};
  let nextId = 1;
  return {
    create: async (input: CreateDecisionInput): Promise<Decision> => {
      const id = `dec-${nextId++}`;
      const d: Decision = {
        id, tenantId: input.tenantId, recommendationId: input.recommendationId ?? null, decidedBy: input.decidedBy,
        executorType: input.executorType, rationale: input.rationale,
        alternativesConsidered: input.alternativesConsidered ?? [], confidence: input.confidence ?? 0.5, explanation: input.explanation ?? null, trace: input.trace ?? [], status: input.status ?? 'approved',
        createdDate: new Date().toISOString(),
      };
      store[id] = d;
      return d;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    list: async (tenantId: string) => Object.values(store).filter((d) => d.tenantId === tenantId),
  };
}

test('DecisionService.reject marks the recommendation rejected without resolving an executor', async () => {
  let recStatus = 'pending';
  const recLookup = {
    findById: async () => mockRec({ status: recStatus }),
    updateStatus: async (_t: string, _id: string, status: string) => { recStatus = status; return mockRec({ status }); },
  };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any);
  const decision = await s.reject({ tenantId: 't1', recommendationId: 'rec-1', decidedBy: 'u1', rationale: 'insufficient evidence' });
  assert.equal(decision.status, 'rejected');
  assert.equal(recStatus, 'rejected');
});
