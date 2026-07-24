import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectMissingEvidence, detectDuplicateSignals, detectUnaddressedHighSeveritySignals } from '../src/reasoning-engine/checks.js';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

test('detectMissingEvidence flags a signal with no evidence past the grace period', () => {
  const signals = [{ id: 's1', source: 'attendance', severity: 'high', createdDate: daysAgo(5) }];
  const findings = detectMissingEvidence(signals, new Set());
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signalId, 's1');
});

test('detectMissingEvidence does NOT flag a signal within the grace period', () => {
  const signals = [{ id: 's1', source: 'attendance', severity: 'high', createdDate: daysAgo(1) }];
  const findings = detectMissingEvidence(signals, new Set());
  assert.equal(findings.length, 0);
});

test('detectMissingEvidence does NOT flag a signal that has evidence attached', () => {
  const signals = [{ id: 's1', source: 'attendance', severity: 'high', createdDate: daysAgo(10) }];
  const findings = detectMissingEvidence(signals, new Set(['s1']));
  assert.equal(findings.length, 0);
});

test('detectMissingEvidence sorts by age descending', () => {
  const signals = [
    { id: 's1', source: 'a', severity: 'low', createdDate: daysAgo(4) },
    { id: 's2', source: 'a', severity: 'low', createdDate: daysAgo(20) },
  ];
  const findings = detectMissingEvidence(signals, new Set());
  assert.equal(findings[0].signalId, 's2');
});

test('detectDuplicateSignals groups signals with matching source/classification/department within the time window', () => {
  const signals = [
    { id: 's1', source: 'attendance', classification: 'chronic_absence', departmentId: 'd1', createdDate: hoursAgo(10) },
    { id: 's2', source: 'attendance', classification: 'chronic_absence', departmentId: 'd1', createdDate: hoursAgo(8) },
  ];
  const findings = detectDuplicateSignals(signals);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].count, 2);
});

test('detectDuplicateSignals does NOT group signals in different departments', () => {
  const signals = [
    { id: 's1', source: 'attendance', classification: 'chronic_absence', departmentId: 'd1', createdDate: hoursAgo(10) },
    { id: 's2', source: 'attendance', classification: 'chronic_absence', departmentId: 'd2', createdDate: hoursAgo(8) },
  ];
  const findings = detectDuplicateSignals(signals);
  assert.equal(findings.length, 0);
});

test('detectDuplicateSignals does NOT group signals outside the time window', () => {
  const signals = [
    { id: 's1', source: 'attendance', classification: 'chronic_absence', departmentId: 'd1', createdDate: hoursAgo(48) },
    { id: 's2', source: 'attendance', classification: 'chronic_absence', departmentId: 'd1', createdDate: hoursAgo(1) },
  ];
  const findings = detectDuplicateSignals(signals, 24);
  assert.equal(findings.length, 0);
});

test('detectDuplicateSignals returns nothing for a single signal', () => {
  const signals = [{ id: 's1', source: 'attendance', classification: 'x', departmentId: 'd1', createdDate: hoursAgo(1) }];
  const findings = detectDuplicateSignals(signals);
  assert.equal(findings.length, 0);
});

test('detectUnaddressedHighSeveritySignals flags a high-severity open signal past the grace period with no recommendation', () => {
  const signals = [{ id: 's1', classification: 'attendance_drop', severity: 'high', status: 'open', createdDate: daysAgo(5) }];
  const findings = detectUnaddressedHighSeveritySignals(signals, new Set());
  assert.equal(findings.length, 1);
  assert.equal(findings[0].signalId, 's1');
});

test('detectUnaddressedHighSeveritySignals does NOT flag a signal that already has a recommendation', () => {
  const signals = [{ id: 's1', classification: 'attendance_drop', severity: 'critical', status: 'open', createdDate: daysAgo(10) }];
  const findings = detectUnaddressedHighSeveritySignals(signals, new Set(['s1']));
  assert.equal(findings.length, 0, 'a signal already acted upon should not be a false alarm');
});

test('detectUnaddressedHighSeveritySignals does NOT flag low/medium severity signals, only high/critical', () => {
  const signals = [{ id: 's1', classification: 'x', severity: 'medium', status: 'open', createdDate: daysAgo(10) }];
  const findings = detectUnaddressedHighSeveritySignals(signals, new Set());
  assert.equal(findings.length, 0);
});

test('detectUnaddressedHighSeveritySignals does NOT flag a closed signal even if high severity', () => {
  const signals = [{ id: 's1', classification: 'x', severity: 'high', status: 'resolved', createdDate: daysAgo(10) }];
  const findings = detectUnaddressedHighSeveritySignals(signals, new Set());
  assert.equal(findings.length, 0);
});

test('detectUnaddressedHighSeveritySignals sorts critical severity before high, then by age', () => {
  const signals = [
    { id: 's1', classification: 'a', severity: 'high', status: 'open', createdDate: daysAgo(20) },
    { id: 's2', classification: 'b', severity: 'critical', status: 'open', createdDate: daysAgo(3) },
  ];
  const findings = detectUnaddressedHighSeveritySignals(signals, new Set());
  assert.equal(findings[0].signalId, 's2', 'critical must sort ahead of high even though it is younger');
});
