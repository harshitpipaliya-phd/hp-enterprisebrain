import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HealthCheckRepository } from '@hpbrain/database';

function createMockRepo() {
  const checks: any[] = [];
  return {
    record: async (checkName: string, status: string, details?: any, responseTime?: number) => {
      const entry = { id: crypto.randomUUID(), checkName, status, details, responseTime, checkedAt: new Date().toISOString() };
      checks.push(entry);
      return entry;
    },
    getLatest: async (checkName: string) => checks.filter(c => c.checkName === checkName).pop() ?? null,
    getHistory: async (checkName: string) => checks.filter(c => c.checkName === checkName),
  };
}

test('HealthCheckRepository.record stores check', async () => {
  const repo = createMockRepo();
  const check = await repo.record('database', 'healthy', { message: 'OK' }, 5);
  assert.equal(check.checkName, 'database');
  assert.equal(check.status, 'healthy');
  assert.equal(check.responseTime, 5);
});

test('HealthCheckRepository.getLatest returns most recent', async () => {
  const repo = createMockRepo();
  await repo.record('database', 'healthy', {}, 5);
  await repo.record('database', 'healthy', {}, 10);
  const latest = await repo.getLatest('database');
  assert.equal(latest?.responseTime, 10);
});

test('HealthCheckRepository.getHistory returns all checks for name', async () => {
  const repo = createMockRepo();
  await repo.record('neo4j', 'healthy', {}, 3);
  await repo.record('neo4j', 'healthy', {}, 4);
  const history = await repo.getHistory('neo4j');
  assert.equal(history.length, 2);
});
