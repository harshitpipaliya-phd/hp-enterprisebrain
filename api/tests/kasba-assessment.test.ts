import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeKasbaScore, computeCapabilityGap, computeCapabilityTrend, computeIndividualScore } from '../src/kasba/assessment-engine.js';
import type { CapabilityProficiency } from '@hpbrain/database';

function mockProficiency(overrides: Partial<CapabilityProficiency> = {}): CapabilityProficiency {
  return {
    id: 'p1', tenantId: 't1', assignmentId: 'a1', knowledgeLevel: null, abilityLevel: null, skillLevel: null,
    behaviourLevel: null, attitudeLevel: null, evidenceConfidence: null, assessedBy: null, assessedDate: null,
    createdDate: new Date().toISOString(), ...overrides,
  };
}

test('computeKasbaScore returns all-null for no assessment record', () => {
  const result = computeKasbaScore(null);
  assert.equal(result.overall, null);
  assert.equal(result.knowledge, null);
});

test('computeKasbaScore computes overall as the mean of ONLY assessed dimensions, not zero-filled', () => {
  const result = computeKasbaScore(mockProficiency({ knowledgeLevel: 4, skillLevel: 2 }));
  assert.equal(result.overall, 3);
  assert.equal(result.ability, null);
});

test('computeKasbaScore with a fully assessed record computes the true mean across all 5 dimensions', () => {
  const result = computeKasbaScore(mockProficiency({ knowledgeLevel: 5, abilityLevel: 4, skillLevel: 3, behaviourLevel: 4, attitudeLevel: 5 }));
  assert.equal(result.overall, 4.2);
});

test('computeCapabilityGap skips a dimension with no stated target', () => {
  const findings = computeCapabilityGap(mockProficiency({ knowledgeLevel: 2 }), { knowledge: undefined });
  assert.equal(findings.length, 0);
});

test('computeCapabilityGap flags a real gap when current is below target', () => {
  const findings = computeCapabilityGap(mockProficiency({ knowledgeLevel: 2 }), { knowledge: { targetLevel: 5 } });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].gap, 3);
  assert.equal(findings[0].currentLevel, 2);
});

test('computeCapabilityGap does NOT flag a dimension that already meets or exceeds target', () => {
  const findings = computeCapabilityGap(mockProficiency({ knowledgeLevel: 5 }), { knowledge: { targetLevel: 5 } });
  assert.equal(findings.length, 0);
});

test('computeCapabilityGap treats a completely unassessed dimension as a gap from zero, but reports currentLevel as null', () => {
  const findings = computeCapabilityGap(null, { skill: { targetLevel: 4 } });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].gap, 4);
  assert.equal(findings[0].currentLevel, null);
});

test('computeCapabilityGap sorts findings by largest gap first', () => {
  const findings = computeCapabilityGap(
    mockProficiency({ knowledgeLevel: 4, skillLevel: 1 }),
    { knowledge: { targetLevel: 5 }, skill: { targetLevel: 5 } }
  );
  assert.equal(findings[0].dimension, 'skill');
});

test('computeCapabilityTrend reports insufficient_data with fewer than 2 real assessments', () => {
  const trend = computeCapabilityTrend([mockProficiency({ knowledgeLevel: 3 })]);
  assert.equal(trend.direction, 'insufficient_data');
  assert.equal(trend.delta, null);
});

test('computeCapabilityTrend detects real improvement across two assessments', () => {
  const history = [mockProficiency({ knowledgeLevel: 2 }), mockProficiency({ knowledgeLevel: 4 })];
  const trend = computeCapabilityTrend(history);
  assert.equal(trend.direction, 'improving');
  assert.equal(trend.delta, 2);
  assert.equal(trend.firstOverall, 2);
  assert.equal(trend.latestOverall, 4);
});

test('computeCapabilityTrend detects real decline', () => {
  const history = [mockProficiency({ knowledgeLevel: 4 }), mockProficiency({ knowledgeLevel: 2 })];
  const trend = computeCapabilityTrend(history);
  assert.equal(trend.direction, 'declining');
  assert.equal(trend.delta, -2);
});

test('computeCapabilityTrend reports stable for a small, non-meaningful change', () => {
  const history = [mockProficiency({ knowledgeLevel: 3 }), mockProficiency({ knowledgeLevel: 3.05 })];
  const trend = computeCapabilityTrend(history);
  assert.equal(trend.direction, 'stable');
});

test('computeCapabilityTrend skips assessment records with zero assessed dimensions when computing scores', () => {
  const history = [mockProficiency({ knowledgeLevel: 2 }), mockProficiency(), mockProficiency({ knowledgeLevel: 4 })];
  const trend = computeCapabilityTrend(history);
  assert.equal(trend.assessmentCount, 3, 'raw history count includes the unassessed record');
  assert.equal(trend.firstOverall, 2, 'but the trend calculation itself only uses records with a real score');
  assert.equal(trend.latestOverall, 4);
});

test('computeIndividualScore returns null for a brand-new person with zero real data anywhere — never a fabricated low score', () => {
  const result = computeIndividualScore({ capabilityOveralls: [], decisionApprovalRate: null, executionSuccessRate: null });
  assert.equal(result.score, null, 'zero data must be null, not silently scored as a real 0');
  assert.equal(result.breakdown.capabilityScore, null);
});

test('computeIndividualScore computes a real score from partial data (capability only, no decisions/executions yet)', () => {
  const result = computeIndividualScore({ capabilityOveralls: [4, 3], decisionApprovalRate: null, executionSuccessRate: null });
  assert.ok(result.score !== null);
  assert.equal(result.breakdown.decisionQuality, null, 'dimensions with no real data stay null in the breakdown, not silently folded into the average as 0');
});

test('computeIndividualScore returns 100 for a person with perfect real scores on every dimension', () => {
  const result = computeIndividualScore({ capabilityOveralls: [5, 5], decisionApprovalRate: 1, executionSuccessRate: 1 });
  assert.equal(result.score, 100);
});

test('computeIndividualScore averages only the dimensions with real data, not diluted by missing ones', () => {
  const withOneDim = computeIndividualScore({ capabilityOveralls: [5, 5], decisionApprovalRate: null, executionSuccessRate: null });
  const withAllDims = computeIndividualScore({ capabilityOveralls: [5, 5], decisionApprovalRate: 1, executionSuccessRate: 1 });
  assert.equal(withOneDim.score, withAllDims.score, 'a perfect single dimension should score the same as three perfect dimensions — missing data must not drag the score down');
});
