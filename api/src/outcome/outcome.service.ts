import type { Outcome, CreateOutcomeInput } from '@hpbrain/database';
import { eventBus, OutcomeEvents } from '@hpbrain/events';

export interface OutcomeRepositoryPort {
  create: (input: CreateOutcomeInput) => Promise<Outcome>;
  findById: (tenantId: string, id: string) => Promise<Outcome | null>;
  findByDecision: (tenantId: string, decisionId: string) => Promise<Outcome[]>;
  list: (tenantId: string) => Promise<Outcome[]>;
}

/** Outcome Engine (Sprint 2 Story 7). Append-only capture of what actually happened. */
export class OutcomeService {
  constructor(private readonly repository: OutcomeRepositoryPort) {}

  async capture(input: CreateOutcomeInput): Promise<Outcome> {
    const outcome = await this.repository.create(input);
    await eventBus.publish({
      type: OutcomeEvents.Captured,
      tenantId: outcome.tenantId,
      entityType: 'Outcome',
      entityId: outcome.id,
      actorId: input.createdBy,
      payload: { outcome },
    });
    return outcome;
  }

  async get(tenantId: string, id: string): Promise<Outcome | null> {
    return this.repository.findById(tenantId, id);
  }

  async forDecision(tenantId: string, decisionId: string): Promise<Outcome[]> {
    return this.repository.findByDecision(tenantId, decisionId);
  }

  async list(tenantId: string): Promise<Outcome[]> {
    return this.repository.list(tenantId);
  }
}
