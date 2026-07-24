import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DecisionService } from '../src/decision/decision.service.js';
import { ExecutorResolverService } from '../src/executor/executor-resolver.service.js';
import type { Recommendation, Decision, CreateDecisionInput, Policy } from '@hpbrain/database';

function mockRec(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'rec-1', tenantId: 't1', reasoningStepId: 'rs-1', category: 'risk', title: 'x', description: null,
    priority: 'high', urgency: 'normal', confidence: 0.9, impact: null, expectedRoi: null, cost: null, risk: null,
    dependencies: [], status: 'pending', createdBy: 'u1', createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
    ...overrides,
  };
}

function mockPolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 'pol-1', tenantId: 't1', name: 'Auto-approve high-confidence compliance', scope: 'recommendations',
    policyType: 'business_rule', allowedExecutorClasses: [], trustLevels: [], routingCriteria: {}, escalationPath: [],
    rules: [
      { field: 'recommendation.category', operator: 'eq', value: 'compliance', action: 'auto_approve' },
      { field: 'recommendation.confidence', operator: 'gte', value: 0.7, action: 'auto_approve' },
    ],
    version: 1, previousVersionId: null, status: 'active', createdBy: 'u1',
    createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
    ...overrides,
  };
}

function createMockDecisionRepo() {
  const store: Record<string, Decision> = {};
  let nextId = 1;
  return {
    create: async (input: CreateDecisionInput): Promise<Decision> => {
      const id = `dec-${nextId++}`;
      const d: Decision = {
        id, tenantId: input.tenantId, recommendationId: input.recommendationId ?? null, decidedBy: input.decidedBy,
        executorType: input.executorType, rationale: input.rationale, alternativesConsidered: input.alternativesConsidered ?? [],
        confidence: input.confidence ?? 0.5, explanation: input.explanation ?? null, trace: input.trace ?? [],
        status: input.status ?? 'approved', createdDate: new Date().toISOString(),
      };
      store[id] = d;
      return d;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    list: async (t: string) => Object.values(store).filter((d) => d.tenantId === t),
  };
}

test('tryAutoApprove approves when an active policy matches with auto_approve action', async () => {
  let recStatus = 'pending';
  const recLookup = {
    findById: async () => mockRec({ category: 'compliance', confidence: 0.8, status: recStatus }),
    updateStatus: async (_t: string, _id: string, status: string) => { recStatus = status; return mockRec({ status }); },
  };
  const policies = { list: async () => [mockPolicy()] };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any, new ExecutorResolverService(), policies as any);
  const decision = await s.tryAutoApprove('t1', 'rec-1');
  assert.ok(decision);
  assert.equal(decision!.decidedBy, 'system:policy-engine');
  assert.equal(recStatus, 'approved');
});

test('tryAutoApprove NEVER approves an opportunity recommendation, even with a matching policy that would otherwise fire', async () => {
  const recLookup = {
    findById: async () => mockRec({ category: 'opportunity', confidence: 0.95, status: 'pending' }),
    updateStatus: async () => mockRec(),
  };
  // Policy deliberately written to try to match opportunity too - the hard rule must still block it.
  const policies = {
    list: async () => [mockPolicy({ rules: [{ field: 'recommendation.category', operator: 'eq', value: 'opportunity', action: 'auto_approve' }] })],
  };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any, new ExecutorResolverService(), policies as any);
  const decision = await s.tryAutoApprove('t1', 'rec-1');
  assert.equal(decision, null, 'opportunity must never be auto-approved regardless of policy content');
});

test('tryAutoApprove does nothing when no policy exists (opt-in, not a default behavior change)', async () => {
  const recLookup = {
    findById: async () => mockRec({ category: 'risk', confidence: 0.9, status: 'pending' }),
    updateStatus: async () => mockRec(),
  };
  const policies = { list: async () => [] };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any, new ExecutorResolverService(), policies as any);
  const decision = await s.tryAutoApprove('t1', 'rec-1');
  assert.equal(decision, null);
});

test('tryAutoApprove does nothing when no policy matches this recommendation', async () => {
  const recLookup = {
    findById: async () => mockRec({ category: 'risk', confidence: 0.2, status: 'pending' }), // low confidence, won't match gte 0.7
    updateStatus: async () => mockRec(),
  };
  const policies = { list: async () => [mockPolicy({ rules: [{ field: 'recommendation.confidence', operator: 'gte', value: 0.7, action: 'auto_approve' }] })] };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any, new ExecutorResolverService(), policies as any);
  const decision = await s.tryAutoApprove('t1', 'rec-1');
  assert.equal(decision, null);
});

test('tryAutoApprove returns null for a recommendation that is not pending (already decided)', async () => {
  const recLookup = {
    findById: async () => mockRec({ category: 'risk', confidence: 0.9, status: 'approved' }),
    updateStatus: async () => mockRec(),
  };
  const policies = { list: async () => [mockPolicy({ rules: [{ field: 'recommendation.confidence', operator: 'gte', value: 0.7, action: 'auto_approve' }] })] };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any, new ExecutorResolverService(), policies as any);
  const decision = await s.tryAutoApprove('t1', 'rec-1');
  assert.equal(decision, null);
});

test('tryAutoApprove returns null when constructed without a policies port at all', async () => {
  const recLookup = { findById: async () => mockRec(), updateStatus: async () => mockRec() };
  const s = new DecisionService(createMockDecisionRepo() as any, recLookup as any); // no policies port
  const decision = await s.tryAutoApprove('t1', 'rec-1');
  assert.equal(decision, null);
});
