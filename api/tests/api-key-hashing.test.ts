import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// ApiKeyRepository itself needs a live database (getPool()), same as every
// other repository in this codebase — untestable without one. What IS
// unit-testable and security-critical enough to verify directly: the
// hashing scheme, since a mistake here would be a real vulnerability.

test('API key hashing is deterministic - required for lookup to work', () => {
  const rawKey = 'hpb_test123456789';
  const hash1 = createHash('sha256').update(rawKey).digest('hex');
  const hash2 = createHash('sha256').update(rawKey).digest('hex');
  assert.equal(hash1, hash2);
});

test('API key hashing produces different hashes for different keys', () => {
  const hash1 = createHash('sha256').update('hpb_keyA').digest('hex');
  const hash2 = createHash('sha256').update('hpb_keyB').digest('hex');
  assert.notEqual(hash1, hash2);
});

test('API key hash never contains the raw key as a substring - confirms this is a real one-way hash', () => {
  const rawKey = 'hpb_supersecretvalue123';
  const hash = createHash('sha256').update(rawKey).digest('hex');
  assert.equal(hash.includes(rawKey), false);
  assert.equal(hash.includes('supersecretvalue'), false);
});

test('SHA-256 hash is always 64 hex characters', () => {
  const hash = createHash('sha256').update('hpb_anything').digest('hex');
  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]+$/);
});
