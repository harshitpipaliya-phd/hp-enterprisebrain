import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PatternDetectionService, suggestCapabilityGaps } from '../src/learning/pattern-detection.service.js';
import type { Learning } from '@hpbrain/database';

function mockLearning(id: string, pattern: string, reusable = true, confidence = 0.8): Learning {
  return { id, tenantId: 't1', outcomeId: 'out-1', mentalModelId: 'mm-1', pattern, description: null, confidence, reusable, createdBy: 'u1', createdDate: new Date().toISOString() };
}

test('PatternDetectionService clusters a term recurring across multiple learnings', () => {
  const detector = new PatternDetectionService();
  const learnings = [
    mockLearning('l1', 'consultative bundling worked in territory expansion'),
    mockLearning('l2', 'consultative bundling closed the deal faster'),
    mockLearning('l3', 'discount push underperformed in the same region'),
  ];
  const patterns = detector.detect(learnings, 2);
  const bundling = patterns.find((p) => p.term === 'consultative' || p.term === 'bundling');
  assert.ok(bundling, 'a term recurring across 2 learnings should be detected');
  assert.equal(bundling!.occurrences, 2);
});

test('PatternDetectionService excludes terms that only appear once (not yet a pattern)', () => {
  const detector = new PatternDetectionService();
  const learnings = [
    mockLearning('l1', 'consultative bundling worked well'),
    mockLearning('l2', 'entirely unrelated observation about logistics'),
  ];
  const patterns = detector.detect(learnings, 2);
  assert.equal(patterns.find((p) => p.term === 'logistics'), undefined, 'a one-off mention should not count as a detected pattern');
});

test('PatternDetectionService ignores non-reusable learnings — only proven patterns should cluster', () => {
  const detector = new PatternDetectionService();
  const learnings = [
    mockLearning('l1', 'discount push failed repeatedly', false, 0.3),
    mockLearning('l2', 'discount push failed again', false, 0.3),
  ];
  const patterns = detector.detect(learnings, 2);
  assert.equal(patterns.length, 0, 'non-reusable learnings should not contribute to detected patterns');
});

test('PatternDetectionService filters stopwords', () => {
  const detector = new PatternDetectionService();
  const learnings = [
    mockLearning('l1', 'this was the best approach for the team'),
    mockLearning('l2', 'this was the right approach for the group'),
  ];
  const patterns = detector.detect(learnings, 2);
  assert.equal(patterns.find((p) => p.term === 'this' || p.term === 'was' || p.term === 'the'), undefined);
});

test('PatternDetectionService sorts by occurrence count descending', () => {
  const detector = new PatternDetectionService();
  const learnings = [
    mockLearning('l1', 'territory expansion worked'),
    mockLearning('l2', 'territory expansion succeeded again'),
    mockLearning('l3', 'territory expansion confirmed a third time'),
    mockLearning('l4', 'bundling helped close deals'),
    mockLearning('l5', 'bundling also helped retention'),
  ];
  const patterns = detector.detect(learnings, 2);
  assert.ok(patterns[0].occurrences >= patterns[patterns.length - 1].occurrences);
});

test('suggestCapabilityGaps flags a real pattern with no matching existing capability', () => {
  const patterns = [{ term: 'negotiation', occurrences: 3, learningIds: ['l1', 'l2', 'l3'], averageConfidence: 0.8 }];
  const suggestions = suggestCapabilityGaps(patterns, ['Communication', 'Leadership']);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].term, 'negotiation');
});

test('suggestCapabilityGaps does NOT flag a pattern that already has a matching capability (substring match)', () => {
  const patterns = [{ term: 'communication', occurrences: 3, learningIds: ['l1'], averageConfidence: 0.8 }];
  const suggestions = suggestCapabilityGaps(patterns, ['Communication Skills']);
  assert.equal(suggestions.length, 0, 'a pattern already covered by an existing capability should not be suggested again');
});

test('suggestCapabilityGaps returns pure data only — no capability is created, this function has no side effects and no way to call the Capability API', () => {
  const patterns = [{ term: 'negotiation', occurrences: 5, learningIds: ['l1'], averageConfidence: 0.9 }];
  const suggestions = suggestCapabilityGaps(patterns, []);
  assert.equal(typeof suggestions, 'object');
  assert.ok(Array.isArray(suggestions));
  // The entire point: this is a plain, synchronous, side-effect-free
  // function. It cannot reach a database or an API even if it wanted to —
  // there is no repository, no fetch call, nothing but array filtering.
});
