import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExecution } from '../src/eso/execution-evaluation.js';
import type { EsoExecution, Evidence } from '@hpbrain/database';

function mockExecution(status: EsoExecution['status']): EsoExecution {
  return {
    id: 'e1', tenantId: 't1', esoId: 'eso-1', decisionId: null, status, executedBy: 'u1', executorType: 'human',
    input: {}, output: null, error: null, startedDate: null, completedDate: null, createdDate: new Date().toISOString(),
  };
}
function mockEvidence(confidence: number): Evidence {
  return {
    id: 'ev1', tenantId: 't1', signalId: null, source: 'internal', evidenceType: 'observation', content: {},
    provenance: {}, confidence, hash: 'h', version: 1, status: 'active', observedDate: new Date().toISOString(),
    createdBy: 'u1', createdDate: new Date().toISOString(),
  };
}

test('evaluateExecution gives completionScore 1 for a completed execution', () => {
  const result = evaluateExecution(mockExecution('completed'), []);
  assert.equal(result.completionScore, 1);
});

test('evaluateExecution gives completionScore 0 for a failed execution', () => {
  const result = evaluateExecution(mockExecution('failed'), []);
  assert.equal(result.completionScore, 0);
});

test('evaluateExecution returns null evidenceScore and overallScore when zero evidence is linked', () => {
  const result = evaluateExecution(mockExecution('completed'), []);
  assert.equal(result.evidenceScore, null);
  assert.equal(result.overallScore, null);
  assert.equal(result.evidenceCount, 0);
});

test('evaluateExecution computes evidenceScore as the mean confidence of linked evidence', () => {
  const result = evaluateExecution(mockExecution('completed'), [mockEvidence(0.8), mockEvidence(0.6)]);
  assert.equal(result.evidenceScore, 0.7);
});

test('evaluateExecution computes overallScore as the mean of completion and evidence scores once evidence exists', () => {
  const result = evaluateExecution(mockExecution('completed'), [mockEvidence(0.6)]);
  assert.equal(result.overallScore, 0.8);
});

test('evaluateExecution gives a partial completionScore for a rolled-back execution', () => {
  const result = evaluateExecution(mockExecution('rolled_back'), []);
  assert.equal(result.completionScore, 0.3);
});
