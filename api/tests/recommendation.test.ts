import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RecommendationService } from '../src/recommendation/recommendation.service.js';
import type { Recommendation, CreateRecommendationInput, ReasoningStep } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Recommendation> = {};
  let nextId = 1;
  return {
    create: async (input: CreateRecommendationInput): Promise<Recommendation> => {
      const id = `rec-${nextId++}`;
      const rec: Recommendation = {
        id, tenantId: input.tenantId, reasoningStepId: input.reasoningStepId ?? null, category: input.category,
        title: input.title, description: input.description ?? null, priority: input.priority ?? 'medium', urgency: input.urgency ?? 'normal', expectedRoi: input.expectedRoi ?? null,
        confidence: input.confidence, impact: input.impact ?? null, cost: input.cost ?? null, risk: input.risk ?? null,
        dependencies: input.dependencies ?? [], status: 'pending', createdBy: input.createdBy,
        createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(),
      };
      store[id] = rec;
      return rec;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    list: async (tenantId: string) => Object.values(store).filter((r) => r.tenantId === tenantId),
    updateStatus: async (_t: string, id: string, status: string) => {
      const existing = store[id];
      if (!existing) return null;
      store[id] = { ...existing, status };
      return store[id];
    },
  };
}

function mockStep(confidenceScore: number): ReasoningStep {
  return {
    id: 'rs-1', tenantId: 't1', caseId: null, signalId: 'sig-1', mentalModelId: null,
    stepOrder: 1, description: 'x', confidenceScore, createdBy: 'u1', createdDate: new Date().toISOString(),
  };
}

test('RecommendationService.generate inherits confidence from reasoning step', async () => {
  const s = new RecommendationService(createMockRepo() as any, { findById: async () => mockStep(0.75) });
  const rec = await s.generate({ tenantId: 't1', reasoningStepId: 'rs-1', category: 'opportunity', title: 'Expand Territory X', createdBy: 'u1' });
  assert.equal(rec.confidence, 0.75);
  assert.equal(rec.priority, 'high');
  assert.equal(rec.category, 'opportunity');
});

test('RecommendationService.generate forces category to watch below the low-confidence threshold', async () => {
  const s = new RecommendationService(createMockRepo() as any, { findById: async () => mockStep(0.25) });
  const rec = await s.generate({ tenantId: 't1', reasoningStepId: 'rs-1', category: 'opportunity', title: 'Weak signal only', createdBy: 'u1' });
  assert.equal(rec.category, 'watch');
});

test('RecommendationService.generate rejects unknown reasoning step', async () => {
  const s = new RecommendationService(createMockRepo() as any, { findById: async () => null });
  await assert.rejects(() => s.generate({ tenantId: 't1', reasoningStepId: 'nope', category: 'risk', title: 'x', createdBy: 'u1' }));
});
