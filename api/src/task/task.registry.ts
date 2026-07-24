/**
 * Task Registry (Sprint 11, scoped). Deterministic task orchestration over
 * existing services — explicitly NOT the "13 AI agents that reason and
 * delegate" version of this ask. Every task here is a real function calling
 * a real, already-tested service. No LLM involved, no new autonomy grant:
 * these are the same operations a human could trigger by hand through the
 * existing screens, just composable into a named, loggable sequence.
 */
export interface TaskDefinition {
  name: string;
  description: string;
  category: string;
  run: (tenantId: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export class TaskRegistry {
  private tasks = new Map<string, TaskDefinition>();

  register(task: TaskDefinition): void {
    if (this.tasks.has(task.name)) throw new Error(`task_already_registered: ${task.name}`);
    this.tasks.set(task.name, task);
  }

  get(name: string): TaskDefinition | undefined {
    return this.tasks.get(name);
  }

  list(): TaskDefinition[] {
    return [...this.tasks.values()];
  }
}
