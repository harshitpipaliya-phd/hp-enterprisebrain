import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCareerReadiness } from '../src/career/career-gap-analysis.js';
import { getLabourMarketProvider, LabourMarketProviderNotConfiguredError } from '../src/career/labour-market-provider.js';
import type { CapabilityProficiency, OccupationRequirement } from '@hpbrain/database';

function mockProficiency(overrides: Partial<CapabilityProficiency> = {}): CapabilityProficiency {
  return {
    id: 'p1', tenantId: 't1', assignmentId: 'a1', knowledgeLevel: null, abilityLevel: null, skillLevel: null,
    behaviourLevel: null, attitudeLevel: null, evidenceConfidence: null, assessedBy: null, assessedDate: null,
    createdDate: new Date().toISOString(), ...overrides,
  };
}

test('computeCareerReadiness returns null score for an occupation with zero stated requirements', () => {
  const result = computeCareerReadiness([], new Map());
  assert.equal(result.readinessScore, null);
});

test('computeCareerReadiness scores 1.0 when every requirement is met', () => {
  const requirements: OccupationRequirement[] = [{ occupationId: 'o1', capabilityId: 'c1', requiredLevel: 3 }];
  const proficiencyMap = new Map([['c1', mockProficiency({ knowledgeLevel: 4, skillLevel: 4 })]]);
  const result = computeCareerReadiness(requirements, proficiencyMap);
  assert.equal(result.readinessScore, 1);
  assert.equal(result.gaps.length, 0);
});

test('computeCareerReadiness flags a real gap when assessed level is below required', () => {
  const requirements: OccupationRequirement[] = [{ occupationId: 'o1', capabilityId: 'c1', requiredLevel: 4 }];
  const proficiencyMap = new Map([['c1', mockProficiency({ knowledgeLevel: 2 })]]);
  const result = computeCareerReadiness(requirements, proficiencyMap);
  assert.equal(result.readinessScore, 0);
  assert.equal(result.gaps.length, 1);
  assert.equal(result.gaps[0].gap, 2);
});

test('computeCareerReadiness treats a completely unassessed capability as currentLevel null', () => {
  const requirements: OccupationRequirement[] = [{ occupationId: 'o1', capabilityId: 'c1', requiredLevel: 3 }];
  const result = computeCareerReadiness(requirements, new Map());
  assert.equal(result.gaps[0].currentLevel, null);
  assert.equal(result.gaps[0].gap, 3);
});

test('computeCareerReadiness computes partial readiness correctly across multiple requirements', () => {
  const requirements: OccupationRequirement[] = [
    { occupationId: 'o1', capabilityId: 'c1', requiredLevel: 3 },
    { occupationId: 'o1', capabilityId: 'c2', requiredLevel: 3 },
  ];
  const proficiencyMap = new Map([
    ['c1', mockProficiency({ knowledgeLevel: 4 })],
    ['c2', mockProficiency({ knowledgeLevel: 1 })],
  ]);
  const result = computeCareerReadiness(requirements, proficiencyMap);
  assert.equal(result.readinessScore, 0.5);
  assert.equal(result.requirementsMet, 1);
});

test('LabourMarketProvider is genuinely unconfigured and throws rather than returning fabricated data', async () => {
  const provider = getLabourMarketProvider();
  assert.equal(provider.available, false);
  await assert.rejects(() => provider.getSalaryTrend('15-1252', 'US'), LabourMarketProviderNotConfiguredError);
  await assert.rejects(() => provider.getDemand('15-1252'), LabourMarketProviderNotConfiguredError);
  await assert.rejects(() => provider.getEmergingSkills('IT'), LabourMarketProviderNotConfiguredError);
});
