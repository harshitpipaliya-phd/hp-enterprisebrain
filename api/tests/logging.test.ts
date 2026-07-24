import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '../src/logging/logger.js';

function createMockRepo() {
  const logs: any[] = [];
  return {
    log: async (entry: any) => { logs.push(entry); return entry; },
    logs,
  };
}

test('Logger.info logs message with context', async () => {
  const repo = createMockRepo();
  const logger = new Logger(repo as any, 'DEBUG');
  await logger.info('Test message', { tenantId: 't1', userId: 'u1', module: 'test' });
  assert.equal(repo.logs.length, 1);
  assert.equal(repo.logs[0].level, 'INFO');
  assert.equal(repo.logs[0].message, 'Test message');
  assert.equal(repo.logs[0].tenantId, 't1');
});

test('Logger.debug is filtered at INFO level', async () => {
  const repo = createMockRepo();
  const logger = new Logger(repo as any, 'INFO');
  await logger.debug('Debug message');
  assert.equal(repo.logs.length, 0);
});

test('Logger.error logs error with context', async () => {
  const repo = createMockRepo();
  const logger = new Logger(repo as any, 'DEBUG');
  await logger.error('Something failed', { correlationId: 'corr-1', executionTime: 150 });
  assert.equal(repo.logs[0].level, 'ERROR');
  assert.equal(repo.logs[0].correlationId, 'corr-1');
  assert.equal(repo.logs[0].executionTime, 150);
});
