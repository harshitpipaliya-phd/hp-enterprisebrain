import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EsoRuntimeService } from '../src/eso/eso-runtime.service.js';
import type { EsoExecution, EsoExecutionStatus, QueueExecutionInput } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, EsoExecution> = {};
  let nextId = 1;
  return {
    queue: async (input: QueueExecutionInput): Promise<EsoExecution> => {
      const id = `exec-${nextId++}`;
      const e: EsoExecution = {
        id, tenantId: input.tenantId, esoId: input.esoId, decisionId: input.decisionId ?? null,
        status: 'queued', executedBy: input.executedBy, executorType: input.executorType,
        input: input.input ?? {}, output: null, error: null, startedDate: null, completedDate: null,
        createdDate: new Date().toISOString(),
      };
      store[id] = e;
      return e;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findByEso: async (tenantId: string, esoId: string) =>
      Object.values(store).filter((e) => e.tenantId === tenantId && e.esoId === esoId),
    list: async (tenantId: string, status?: EsoExecutionStatus) =>
      Object.values(store).filter((e) => e.tenantId === tenantId && (!status || e.status === status)),
    transition: async (_t: string, id: string, status: EsoExecutionStatus, patch: any = {}) => {
      const existing = store[id];
      if (!existing) return null;
      store[id] = { ...existing, status, output: patch.output ?? existing.output, error: patch.error ?? existing.error };
      return store[id];
    },
  };
}

test('EsoRuntimeService.execute queues an execution', async () => {
  const s = new EsoRuntimeService(createMockRepo() as any);
  const exec = await s.execute({ tenantId: 't1', esoId: 'eso-1', executedBy: 'u1', executorType: 'ai_agent' });
  assert.equal(exec.status, 'queued');
});

test('EsoRuntimeService.transition allows queued -> running -> completed', async () => {
  const s = new EsoRuntimeService(createMockRepo() as any);
  const exec = await s.execute({ tenantId: 't1', esoId: 'eso-1', executedBy: 'u1', executorType: 'ai_agent' });
  await s.transition('t1', exec.id, 'running', 'u1');
  const completed = await s.transition('t1', exec.id, 'completed', 'u1', { output: { result: 'ok' } });
  assert.equal(completed.status, 'completed');
});

test('EsoRuntimeService.transition rejects invalid transitions', async () => {
  const s = new EsoRuntimeService(createMockRepo() as any);
  const exec = await s.execute({ tenantId: 't1', esoId: 'eso-1', executedBy: 'u1', executorType: 'ai_agent' });
  // queued -> completed directly is not a valid transition
  await assert.rejects(() => s.transition('t1', exec.id, 'completed', 'u1'), /invalid_transition/);
});

test('EsoRuntimeService.rollback works only after completed', async () => {
  const s = new EsoRuntimeService(createMockRepo() as any);
  const exec = await s.execute({ tenantId: 't1', esoId: 'eso-1', executedBy: 'u1', executorType: 'ai_agent' });
  await s.transition('t1', exec.id, 'running', 'u1');
  await s.transition('t1', exec.id, 'completed', 'u1');
  const rolledBack = await s.rollback('t1', exec.id, 'u1');
  assert.equal(rolledBack.status, 'rolled_back');
});

test('EsoRuntimeService.listAll returns every execution for a tenant, across ESOs', async () => {
  const s = new EsoRuntimeService(createMockRepo() as any);
  await s.execute({ tenantId: 't1', esoId: 'eso-1', executedBy: 'u1', executorType: 'ai_agent' });
  await s.execute({ tenantId: 't1', esoId: 'eso-2', executedBy: 'u1', executorType: 'human' });
  await s.execute({ tenantId: 't2', esoId: 'eso-1', executedBy: 'u2', executorType: 'ai_agent' });
  const all = await s.listAll('t1');
  assert.equal(all.length, 2, 'must only return t1 executions, tenant-scoped');
});

test('EsoRuntimeService.listAll filters by status when given', async () => {
  const s = new EsoRuntimeService(createMockRepo() as any);
  const exec1 = await s.execute({ tenantId: 't1', esoId: 'eso-1', executedBy: 'u1', executorType: 'ai_agent' });
  await s.execute({ tenantId: 't1', esoId: 'eso-2', executedBy: 'u1', executorType: 'human' });
  await s.transition('t1', exec1.id, 'running', 'u1');
  const running = await s.listAll('t1', 'running');
  assert.equal(running.length, 1);
  assert.equal(running[0].id, exec1.id);
});
