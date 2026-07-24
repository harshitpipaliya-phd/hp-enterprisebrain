import type { EsoExecution, EsoExecutionStatus, QueueExecutionInput } from '@hpbrain/database';
import { eventBus, EsoExecutionEvents } from '@hpbrain/events';

export interface EsoExecutionRepositoryPort {
  queue: (input: QueueExecutionInput) => Promise<EsoExecution>;
  findById: (tenantId: string, id: string) => Promise<EsoExecution | null>;
  findByEso: (tenantId: string, esoId: string) => Promise<EsoExecution[]>;
  list: (tenantId: string, status?: EsoExecutionStatus) => Promise<EsoExecution[]>;
  transition: (tenantId: string, id: string, status: EsoExecutionStatus, patch?: { output?: Record<string, unknown>; error?: string }) => Promise<EsoExecution | null>;
}

const VALID_TRANSITIONS: Record<EsoExecutionStatus, EsoExecutionStatus[]> = {
  queued: ['running', 'failed'],
  running: ['completed', 'failed'],
  completed: ['rolled_back'],
  failed: ['queued'], // retry
  rolled_back: [],
};

/**
 * ESO Runtime (Sprint 2 Story 5).
 * Tracks execution lifecycle for an ESO — contract validation itself is out of scope
 * here (the ESO Contract is frozen-DRAFT per your instruction not to redesign it);
 * this only tracks that an already-resolved ESO ran, what happened, and whether it
 * can be rolled back. Execution history is queryable per ESO for audit.
 */
export class EsoRuntimeService {
  constructor(private readonly repository: EsoExecutionRepositoryPort) {}

  async execute(input: QueueExecutionInput): Promise<EsoExecution> {
    const execution = await this.repository.queue(input);
    await eventBus.publish({
      type: EsoExecutionEvents.Queued,
      tenantId: execution.tenantId,
      entityType: 'EsoExecution',
      entityId: execution.id,
      actorId: input.executedBy,
      payload: { execution },
    });
    return execution;
  }

  async transition(tenantId: string, id: string, status: EsoExecutionStatus, actorId: string, patch: { output?: Record<string, unknown>; error?: string } = {}): Promise<EsoExecution> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) throw new Error('execution_not_found');
    if (!VALID_TRANSITIONS[existing.status].includes(status)) {
      throw new Error(`invalid_transition: ${existing.status} -> ${status}`);
    }
    const updated = await this.repository.transition(tenantId, id, status, patch);
    if (!updated) throw new Error('execution_not_found');
    await eventBus.publish({
      type: EsoExecutionEvents.Transitioned,
      tenantId: updated.tenantId,
      entityType: 'EsoExecution',
      entityId: updated.id,
      actorId,
      payload: { from: existing.status, to: updated.status, execution: updated },
    });
    return updated;
  }

  async rollback(tenantId: string, id: string, actorId: string): Promise<EsoExecution> {
    return this.transition(tenantId, id, 'rolled_back', actorId);
  }

  async history(tenantId: string, esoId: string): Promise<EsoExecution[]> {
    return this.repository.findByEso(tenantId, esoId);
  }

  async listAll(tenantId: string, status?: EsoExecutionStatus): Promise<EsoExecution[]> {
    return this.repository.list(tenantId, status);
  }
}
