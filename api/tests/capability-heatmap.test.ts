import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCapabilityHeatmap } from '../src/kasba/capability-heatmap.js';
import type { CapabilityProficiency, CapabilityAssignment, Person } from '@hpbrain/database';

function mockProficiency(assignmentId: string, overrides: Partial<CapabilityProficiency> = {}): CapabilityProficiency {
  return { id: `p-${assignmentId}`, tenantId: 't1', assignmentId, knowledgeLevel: null, abilityLevel: null, skillLevel: null, behaviourLevel: null, attitudeLevel: null, evidenceConfidence: null, assessedBy: null, assessedDate: null, createdDate: new Date().toISOString(), ...overrides };
}
function mockAssignment(id: string, capabilityId: string, personId: string): CapabilityAssignment {
  return { id, tenantId: 't1', capabilityId, targetType: 'person', targetId: personId, assignedBy: 'u1', assignedDate: new Date().toISOString(), status: 'active' };
}
function mockPerson(id: string, departmentId: string | null): Person {
  return { id, tenantId: 't1', departmentId } as unknown as Person;
}

test('computeCapabilityHeatmap aggregates real proficiency into a department-level average, not per-person', () => {
  const proficiency = [mockProficiency('a1', { knowledgeLevel: 4 }), mockProficiency('a2', { knowledgeLevel: 2 })];
  const assignments = [mockAssignment('a1', 'cap1', 'p1'), mockAssignment('a2', 'cap1', 'p2')];
  const people = [mockPerson('p1', 'dept1'), mockPerson('p2', 'dept1')];
  const heatmap = computeCapabilityHeatmap(proficiency, assignments, people);
  assert.equal(heatmap.length, 1);
  assert.equal(heatmap[0].averageLevel, 3);
  assert.equal(heatmap[0].assessedCount, 2);
});

test('computeCapabilityHeatmap output contains no person identifier of any kind', () => {
  const proficiency = [mockProficiency('a1', { knowledgeLevel: 4 })];
  const assignments = [mockAssignment('a1', 'cap1', 'p1')];
  const people = [mockPerson('p1', 'dept1')];
  const heatmap = computeCapabilityHeatmap(proficiency, assignments, people);
  const keys = Object.keys(heatmap[0]);
  assert.deepEqual(keys.sort(), ['assessedCount', 'averageLevel', 'capabilityId', 'departmentId'].sort());
});

test('computeCapabilityHeatmap separates departments into distinct buckets', () => {
  const proficiency = [mockProficiency('a1', { knowledgeLevel: 5 }), mockProficiency('a2', { knowledgeLevel: 1 })];
  const assignments = [mockAssignment('a1', 'cap1', 'p1'), mockAssignment('a2', 'cap1', 'p2')];
  const people = [mockPerson('p1', 'deptA'), mockPerson('p2', 'deptB')];
  const heatmap = computeCapabilityHeatmap(proficiency, assignments, people);
  assert.equal(heatmap.length, 2);
});

test('computeCapabilityHeatmap skips records with zero assessed dimensions', () => {
  const proficiency = [mockProficiency('a1')];
  const assignments = [mockAssignment('a1', 'cap1', 'p1')];
  const people = [mockPerson('p1', 'dept1')];
  const heatmap = computeCapabilityHeatmap(proficiency, assignments, people);
  assert.equal(heatmap.length, 0);
});

test('computeCapabilityHeatmap ignores non-person target types', () => {
  const proficiency = [mockProficiency('a1', { knowledgeLevel: 3 })];
  const assignments: CapabilityAssignment[] = [{ id: 'a1', tenantId: 't1', capabilityId: 'cap1', targetType: 'department', targetId: 'dept1', assignedBy: 'u1', assignedDate: new Date().toISOString(), status: 'active' }];
  const heatmap = computeCapabilityHeatmap(proficiency, assignments, []);
  assert.equal(heatmap.length, 0);
});
