import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReasoningService } from '../src/reasoning/reasoning.service.js';
import type { ReasoningStep, CreateReasoningStepInput, Evidence } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, ReasoningStep> = {};
  let nextId = 1;
  return {
    create: async (input: CreateReasoningStepInput): Promise<ReasoningStep> => {
      const id = `rs-${nextId++}`;
      const step: ReasoningStep = {
        id, tenantId: input.tenantId, caseId: input.caseId ?? null, signalId: input.signalId ?? null,
        mentalModelId: input.mentalModelId ?? null, stepOrder: input.stepOrder, description: input.description,
        confidenceScore: input.confidenceScore, createdBy: input.createdBy, createdDate: new Date().toISOString(),
      };
      store[id] = step;
      return step;
    },
    findBySignal: async (tenantId: string, signalId: string) =>
      Object.values(store).filter((s) => s.tenantId === tenantId && s.signalId === signalId),
    findById: async (_t: string, id: string) => store[id] ?? null,
  };
}

function evidenceList(confidences: number[]): Evidence[] {
  return confidences.map((c, i) => ({
    id: `ev-${i}`, tenantId: 't1', signalId: 'sig-1', source: 'x', evidenceType: 'observation',
    content: {}, provenance: {}, confidence: c, hash: 'h', version: 1, status: 'active', observedDate: new Date().toISOString(),
    createdBy: 'u1', createdDate: new Date().toISOString(),
  }));
}

test('ReasoningService: no evidence yields low base confidence (Watch-tier)', async () => {
  const s = new ReasoningService(createMockRepo() as any, { findBySignal: async () => [] });
  const step = await s.reason({ tenantId: 't1', signalId: 'sig-1', description: 'lone news signal', createdBy: 'u1' });
  assert.equal(step.confidenceScore, 0.3);
});

test('ReasoningService: internal-corroborated evidence raises confidence above the low-confidence threshold', async () => {
  const s = new ReasoningService(createMockRepo() as any, { findBySignal: async () => evidenceList([0.9, 0.8]) });
  const step = await s.reason({ tenantId: 't1', signalId: 'sig-1', description: 'corroborated', createdBy: 'u1' });
  assert.ok(step.confidenceScore > 0.4, `expected > 0.4, got ${step.confidenceScore}`);
});

test('ReasoningService: confidence never exceeds 0.95', async () => {
  const s = new ReasoningService(createMockRepo() as any, { findBySignal: async () => evidenceList([1, 1, 1, 1, 1, 1, 1, 1]) });
  const step = await s.reason({ tenantId: 't1', signalId: 'sig-1', description: 'many strong evidence', createdBy: 'u1' });
  assert.ok(step.confidenceScore <= 0.95);
});

test('ReasoningService.reason increments stepOrder per signal', async () => {
  const repo = createMockRepo();
  const s = new ReasoningService(repo as any, { findBySignal: async () => [] });
  const first = await s.reason({ tenantId: 't1', signalId: 'sig-1', description: 'first', createdBy: 'u1' });
  const second = await s.reason({ tenantId: 't1', signalId: 'sig-1', description: 'second', createdBy: 'u1' });
  assert.equal(first.stepOrder, 1);
  assert.equal(second.stepOrder, 2);
});
