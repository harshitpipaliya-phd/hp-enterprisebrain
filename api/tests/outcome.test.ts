import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OutcomeService } from '../src/outcome/outcome.service.js';
import type { Outcome, CreateOutcomeInput } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Outcome> = {};
  let nextId = 1;
  return {
    create: async (input: CreateOutcomeInput): Promise<Outcome> => {
      const id = `out-${nextId++}`;
      const o: Outcome = {
        id, tenantId: input.tenantId, decisionId: input.decisionId ?? null, result: input.result,
        metrics: input.metrics ?? {}, kpis: input.kpis ?? {}, evidenceIds: input.evidenceIds ?? [],
        feedback: input.feedback ?? null, confidence: input.confidence ?? 0.5, createdBy: input.createdBy,
        createdDate: new Date().toISOString(),
      };
      store[id] = o;
      return o;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findByDecision: async (tenantId: string, decisionId: string) =>
      Object.values(store).filter((o) => o.tenantId === tenantId && o.decisionId === decisionId),
    list: async (tenantId: string) => Object.values(store).filter((o) => o.tenantId === tenantId),
  };
}

test('OutcomeService.capture stores result and metrics', async () => {
  const s = new OutcomeService(createMockRepo() as any);
  const o = await s.capture({
    tenantId: 't1', decisionId: 'dec-1', result: 'success',
    metrics: { revenueImpact: 140000 }, confidence: 0.8, createdBy: 'u1',
  });
  assert.equal(o.result, 'success');
  assert.equal(o.metrics.revenueImpact, 140000);
});

test('OutcomeService.forDecision filters by decision', async () => {
  const repo = createMockRepo();
  const s = new OutcomeService(repo as any);
  await repo.create({ tenantId: 't1', decisionId: 'dec-1', result: 'success', createdBy: 'u1' });
  await repo.create({ tenantId: 't1', decisionId: 'dec-2', result: 'failure', createdBy: 'u1' });
  const results = await s.forDecision('t1', 'dec-1');
  assert.equal(results.length, 1);
  assert.equal(results[0].result, 'success');
});
