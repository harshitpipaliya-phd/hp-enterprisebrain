import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDecisionIntelligence } from '../src/analytics/analytics.routes.js';

test('computeDecisionIntelligence: pipeline counts by recommendation status', () => {
  const result = computeDecisionIntelligence({
    allDecisions: [],
    allRecommendations: [
      { id: 'r1', category: 'risk', status: 'pending', createdDate: '2026-01-01T00:00:00Z' },
      { id: 'r2', category: 'risk', status: 'approved', createdDate: '2026-01-01T00:00:00Z' },
      { id: 'r3', category: 'risk', status: 'rejected', createdDate: '2026-01-01T00:00:00Z' },
    ],
  });
  assert.deepEqual(result.pipeline, { pending: 1, approved: 1, rejected: 1 });
});

test('computeDecisionIntelligence: latency computed as decision time minus recommendation time', () => {
  const result = computeDecisionIntelligence({
    allDecisions: [{ status: 'approved', executorType: 'human', recommendationId: 'r1', createdDate: '2026-01-01T02:00:00Z' }],
    allRecommendations: [{ id: 'r1', category: 'risk', status: 'approved', createdDate: '2026-01-01T00:00:00Z' }],
  });
  assert.equal(result.averageDecisionLatencyHours, 2);
});

test('computeDecisionIntelligence: returns null latency when no decisions link to recommendations', () => {
  const result = computeDecisionIntelligence({ allDecisions: [], allRecommendations: [] });
  assert.equal(result.averageDecisionLatencyHours, null);
});

test('computeDecisionIntelligence: heatmap groups by recommendation category and executor type', () => {
  const result = computeDecisionIntelligence({
    allDecisions: [
      { status: 'approved', executorType: 'ai_agent', recommendationId: 'r1', createdDate: '2026-01-01T01:00:00Z' },
      { status: 'approved', executorType: 'human', recommendationId: 'r2', createdDate: '2026-01-01T01:00:00Z' },
    ],
    allRecommendations: [
      { id: 'r1', category: 'risk', status: 'approved', createdDate: '2026-01-01T00:00:00Z' },
      { id: 'r2', category: 'opportunity', status: 'approved', createdDate: '2026-01-01T00:00:00Z' },
    ],
  });
  assert.equal(result.categoryExecutorHeatmap.risk.ai_agent, 1);
  assert.equal(result.categoryExecutorHeatmap.opportunity.human, 1);
});

test('computeDecisionIntelligence: counts decisions by executor type regardless of recommendation link', () => {
  const result = computeDecisionIntelligence({
    allDecisions: [
      { status: 'approved', executorType: 'human', recommendationId: null, createdDate: '2026-01-01T00:00:00Z' },
      { status: 'approved', executorType: 'human', recommendationId: null, createdDate: '2026-01-01T00:00:00Z' },
    ],
    allRecommendations: [],
  });
  assert.equal(result.decisionsByExecutorType.human, 2);
});
