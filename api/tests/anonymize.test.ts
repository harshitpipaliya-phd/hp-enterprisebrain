import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anonymize, generalize } from '../src/learning/anonymize.js';

test('anonymize redacts email addresses', () => {
  const result = anonymize('Contact rahul.sharma@school.edu.in for details');
  assert.ok(result.text.includes('[REDACTED_EMAIL]'));
  assert.ok(!result.text.includes('rahul.sharma@school.edu.in'));
  assert.equal(result.redactionCount, 1);
});

test('anonymize redacts ID-like tokens', () => {
  const result = anonymize('Student ID STU-4821 missed two payments');
  assert.ok(result.text.includes('[REDACTED_ID]'));
  assert.equal(result.redactionCount, 1);
});

test('generalize redacts name-like sequences', () => {
  const result = generalize('Rahul Sharma responded well to the reminder');
  assert.ok(result.text.includes('[ENTITY]'));
  assert.ok(!result.text.includes('Rahul Sharma'));
});

test('generalize does not over-redact ordinary business terms', () => {
  const result = generalize('consultative bundling wins in mid-size territories');
  assert.equal(result.redactionCount, 0);
  assert.equal(result.text, 'consultative bundling wins in mid-size territories');
});
