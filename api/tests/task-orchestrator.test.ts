import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaskRegistry, type TaskDefinition } from '../src/task/task.registry.js';
import { TaskOrchestrator } from '../src/task/task.orchestrator.js';
import { EsoRuntimeService } from '../src/eso/eso-runtime.service.js';
import type { EsoExecution } from '@hpbrain/database';

function mockRepo() {
  const store: Record<string, EsoExecution> = {};
  let nextId = 1;
  return {
    queue: async (input: any) => {
      const e: EsoExecution = {
        id: `exec-${nextId++}`, tenantId: input.tenantId, esoId: input.esoId, decisionId: null,
        status: 'queued', executedBy: input.executedBy, executorType: input.executorType, input: input.input ?? {},
        output: null, error: null, startedDate: null, completedDate: null, createdDate: new Date().toISOString(),
      };
      store[e.id] = e;
      return e;
    },
    findById: async (_t: string, id: string) => store[id] ?? null,
    findByEso: async () => [],
    transition: async (_t: string, id: string, status: any, patch: any = {}) => {
      store[id] = { ...store[id], status, output: patch.output ?? store[id].output, error: patch.error ?? store[id].error };
      return store[id];
    },
  };
}

test('TaskRegistry rejects registering the same task name twice', () => {
  const registry = new TaskRegistry();
  const task: TaskDefinition = { name: 'x', description: 'x', category: 'test', run: async () => ({}) };
  registry.register(task);
  assert.throws(() => registry.register(task), /task_already_registered/);
});

test('TaskOrchestrator runs a sequence and reports success for each step', async () => {
  const registry = new TaskRegistry();
  registry.register({ name: 'step1', description: '', category: 'test', run: async () => ({ result: 1 }) });
  registry.register({ name: 'step2', description: '', category: 'test', run: async () => ({ result: 2 }) });
  const runtime = new EsoRuntimeService(mockRepo() as any);
  const orchestrator = new TaskOrchestrator(registry, runtime);

  const result = await orchestrator.runSequence('t1', 'u1', [{ taskName: 'step1' }, { taskName: 'step2' }]);
  assert.equal(result.allSucceeded, true);
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[0].output?.result, 1);
  assert.equal(result.steps[1].output?.result, 2);
});

test('TaskOrchestrator stops on first failure when stopOnFailure is true', async () => {
  const registry = new TaskRegistry();
  registry.register({ name: 'ok', description: '', category: 'test', run: async () => ({ ok: true }) });
  registry.register({ name: 'fails', description: '', category: 'test', run: async () => { throw new Error('boom'); } });
  registry.register({ name: 'never-reached', description: '', category: 'test', run: async () => ({ reached: true }) });
  const runtime = new EsoRuntimeService(mockRepo() as any);
  const orchestrator = new TaskOrchestrator(registry, runtime);

  const result = await orchestrator.runSequence('t1', 'u1', [{ taskName: 'ok' }, { taskName: 'fails' }, { taskName: 'never-reached' }], true);
  assert.equal(result.allSucceeded, false);
  assert.equal(result.steps.length, 2, 'the third step must never run once stopOnFailure triggers');
  assert.equal(result.steps[1].status, 'failed');
});

test('TaskOrchestrator continues past a failure when stopOnFailure is false', async () => {
  const registry = new TaskRegistry();
  registry.register({ name: 'fails', description: '', category: 'test', run: async () => { throw new Error('boom'); } });
  registry.register({ name: 'still-runs', description: '', category: 'test', run: async () => ({ ran: true }) });
  const runtime = new EsoRuntimeService(mockRepo() as any);
  const orchestrator = new TaskOrchestrator(registry, runtime);

  const result = await orchestrator.runSequence('t1', 'u1', [{ taskName: 'fails' }, { taskName: 'still-runs' }], false);
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[1].status, 'completed');
});

test('TaskOrchestrator retries up to maxRetries and succeeds if a later attempt works', async () => {
  const registry = new TaskRegistry();
  let attempts = 0;
  registry.register({
    name: 'flaky', description: '', category: 'test',
    run: async () => { attempts++; if (attempts < 3) throw new Error('transient'); return { succeededOnAttempt: attempts }; },
  });
  const runtime = new EsoRuntimeService(mockRepo() as any);
  const orchestrator = new TaskOrchestrator(registry, runtime);

  const result = await orchestrator.runSequence('t1', 'u1', [{ taskName: 'flaky', maxRetries: 3 }]);
  assert.equal(result.allSucceeded, true);
  assert.equal(result.steps[0].attempts, 3);
});

test('TaskOrchestrator reports unknown_task without crashing', async () => {
  const registry = new TaskRegistry();
  const runtime = new EsoRuntimeService(mockRepo() as any);
  const orchestrator = new TaskOrchestrator(registry, runtime);

  const result = await orchestrator.runSequence('t1', 'u1', [{ taskName: 'does-not-exist' }]);
  assert.equal(result.allSucceeded, false);
  assert.match(result.steps[0].error ?? '', /unknown_task/);
});
