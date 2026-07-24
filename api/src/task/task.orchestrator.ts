import type { TaskRegistry } from './task.registry.js';
import { EsoRuntimeService } from '../eso/eso-runtime.service.js';

export interface TaskStep {
  taskName: string;
  input?: Record<string, unknown>;
  maxRetries?: number;
}

export interface TaskStepResult {
  taskName: string;
  status: 'completed' | 'failed';
  output?: Record<string, unknown>;
  error?: string;
  attempts: number;
  executionId: string;
}

export interface OrchestrationResult {
  steps: TaskStepResult[];
  allSucceeded: boolean;
}

/**
 * Task Orchestrator (Sprint 11, scoped). Sequential execution only — no
 * parallel/conditional branching, no scheduler, no resource metrics. Each
 * step is tracked through EsoRuntimeService, the SAME execution state
 * machine (queued->running->completed/failed) built in Sprint 2 for ESO
 * execution — deliberate reuse, not a second parallel tracking system.
 */
export class TaskOrchestrator {
  constructor(
    private readonly registry: TaskRegistry,
    private readonly runtime: EsoRuntimeService
  ) {}

  async runSequence(tenantId: string, actorId: string, steps: TaskStep[], stopOnFailure = true): Promise<OrchestrationResult> {
    const results: TaskStepResult[] = [];

    for (const step of steps) {
      const task = this.registry.get(step.taskName);
      if (!task) {
        results.push({ taskName: step.taskName, status: 'failed', error: `unknown_task: ${step.taskName}`, attempts: 0, executionId: '' });
        if (stopOnFailure) break;
        continue;
      }

      const maxRetries = step.maxRetries ?? 0;
      let attempt = 0;
      let lastError: string | undefined;
      let execution = await this.runtime.execute({
        tenantId, esoId: `task:${step.taskName}`, executedBy: actorId, executorType: 'software', input: step.input ?? {},
      });

      while (attempt <= maxRetries) {
        attempt++;
        try {
          await this.runtime.transition(tenantId, execution.id, 'running', actorId);
          const output = await task.run(tenantId, step.input ?? {});
          await this.runtime.transition(tenantId, execution.id, 'completed', actorId, { output });
          results.push({ taskName: step.taskName, status: 'completed', output, attempts: attempt, executionId: execution.id });
          lastError = undefined;
          break;
        } catch (e: any) {
          lastError = e.message;
          if (attempt <= maxRetries) {
            await this.runtime.transition(tenantId, execution.id, 'failed', actorId, { error: e.message });
            execution = await this.runtime.execute({ tenantId, esoId: `task:${step.taskName}`, executedBy: actorId, executorType: 'software', input: step.input ?? {} });
          }
        }
      }

      if (lastError) {
        await this.runtime.transition(tenantId, execution.id, 'failed', actorId, { error: lastError });
        results.push({ taskName: step.taskName, status: 'failed', error: lastError, attempts: attempt, executionId: execution.id });
        if (stopOnFailure) break;
      }
    }

    return { steps: results, allSucceeded: results.every((r) => r.status === 'completed') };
  }
}
