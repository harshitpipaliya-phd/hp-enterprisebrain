import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MentalModelService } from '../src/mental-model/mental-model.service.js';
import { LearningService } from '../src/learning/learning.service.js';
import type { MentalModel, Outcome } from '@hpbrain/database';

function createMockModelRepo() {
  const store: Record<string, MentalModel> = {};
  let nextId = 1;
  return {
    create: async (input: any): Promise<MentalModel> => {
      const id = `mm-${nextId++}`;
      const m: MentalModel = {
        id, tenantId: input.tenantId, name: input.name, description: input.description ?? null,
        domain: input.domain, rules: input.rules ?? { patterns: [] }, confidence: input.confidence ?? 0.5,
        reinforcementCount: 0, version: 1, status: 'active', createdBy: input.createdBy,
        createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
      };
      store[id] = m;
      return m;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findActiveByDomain: async (t: string, domain: string) =>
      Object.values(store).find((m) => m.tenantId === t && m.domain === domain && m.status === 'active') ?? null,
    list: async (t: string) => Object.values(store).filter((m) => m.tenantId === t),
    reinforce: async (_t: string, id: string, pattern: string, newConfidence: number) => {
      const existing = store[id];
      const patterns = [...(existing.rules as any).patterns, pattern];
      const blended = Number((existing.confidence * 0.7 + newConfidence * 0.3).toFixed(3));
      store[id] = { ...existing, rules: { patterns }, confidence: blended, reinforcementCount: existing.reinforcementCount + 1, version: existing.version + 1 };
      return store[id];
    },
  };
}

test('MentalModelService.reinforceFromLearning creates the first model for a new domain', async () => {
  const s = new MentalModelService(createMockModelRepo() as any);
  const model = await s.reinforceFromLearning('t1', 'sales-strategy', 'consultative bundling wins in mid-size territories', 0.8, 'u1');
  assert.equal(model.domain, 'sales-strategy');
  assert.equal(model.reinforcementCount, 0); // first creation, not yet reinforced
  assert.deepEqual((model.rules as any).patterns, ['consultative bundling wins in mid-size territories']);
});

test('MentalModelService.reinforceFromLearning reinforces an existing domain model rather than creating a duplicate', async () => {
  const s = new MentalModelService(createMockModelRepo() as any);
  const first = await s.reinforceFromLearning('t1', 'sales-strategy', 'pattern one', 0.7, 'u1');
  const second = await s.reinforceFromLearning('t1', 'sales-strategy', 'pattern two', 0.9, 'u1');
  assert.equal(first.id, second.id);
  assert.equal(second.reinforcementCount, 1);
  assert.deepEqual((second.rules as any).patterns, ['pattern one', 'pattern two']);
});

test('MentalModelService.reinforceFromLearning blends confidence rather than overwriting it', async () => {
  const s = new MentalModelService(createMockModelRepo() as any);
  const first = await s.reinforceFromLearning('t1', 'fee-collection', 'pattern one', 0.5, 'u1');
  const second = await s.reinforceFromLearning('t1', 'fee-collection', 'pattern two', 0.9, 'u1');
  // blended = 0.5*0.7 + 0.9*0.3 = 0.62, not simply 0.9
  assert.equal(second.confidence, 0.62);
});

function mockOutcome(result: Outcome['result'], confidence: number): Outcome {
  return {
    id: 'out-1', tenantId: 't1', decisionId: 'dec-1', result, metrics: {}, kpis: {},
    evidenceIds: [], feedback: null, confidence, createdBy: 'u1', createdDate: new Date().toISOString(),
  };
}

test('LearningService.extract reinforces a mental model when reusable and a domain is given', async () => {
  const modelRepo = createMockModelRepo();
  const mentalModels = new MentalModelService(modelRepo as any);
  const learningStore: any[] = [];
  const learningRepo = {
    create: async (input: any) => { const l = { ...input, id: 'learn-1', createdDate: new Date().toISOString() }; learningStore.push(l); return l; },
    list: async () => learningStore,
    findReusable: async () => learningStore.filter((l) => l.reusable),
  };
  const s = new LearningService(learningRepo as any, { findById: async () => mockOutcome('success', 0.8) }, mentalModels);

  const learning = await s.extract({ tenantId: 't1', outcomeId: 'out-1', domain: 'sales-strategy', pattern: 'consultative bundling worked', createdBy: 'u1' });

  assert.ok(learning.mentalModelId, 'learning should be linked to the mental model it reinforced');
  const model = await mentalModels.forDomain('t1', 'sales-strategy');
  assert.ok(model);
  assert.equal(model!.id, learning.mentalModelId);
});

test('LearningService.extract does not reinforce a mental model when the outcome failed', async () => {
  const mentalModels = new MentalModelService(createMockModelRepo() as any);
  const learningRepo = {
    create: async (input: any) => ({ ...input, id: 'learn-1', createdDate: new Date().toISOString() }),
    list: async () => [],
    findReusable: async () => [],
  };
  const s = new LearningService(learningRepo as any, { findById: async () => mockOutcome('failure', 0.8) }, mentalModels);
  const learning = await s.extract({ tenantId: 't1', outcomeId: 'out-1', domain: 'sales-strategy', pattern: 'discount push underperformed', createdBy: 'u1' });
  assert.equal(learning.mentalModelId, null);
  const model = await mentalModels.forDomain('t1', 'sales-strategy');
  assert.equal(model, null);
});
