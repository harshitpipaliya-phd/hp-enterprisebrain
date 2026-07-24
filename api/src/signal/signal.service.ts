import type { Signal, CreateSignalInput, SignalStatus, SignalSource } from '@hpbrain/database';
import { eventBus, SignalEvents } from '@hpbrain/events';

export interface SignalRepositoryPort {
  create: (input: CreateSignalInput) => Promise<Signal>;
  findById: (tenantId: string, id: string) => Promise<Signal | null>;
  list: (tenantId: string, orgId?: string, status?: SignalStatus, source?: SignalSource) => Promise<Signal[]>;
  updateStatus: (tenantId: string, id: string, patch: { status: SignalStatus }) => Promise<Signal | null>;
}

/**
 * Signal Intelligence Engine (Sprint 2 Story 1).
 * A Signal is a raw, unverified observation surfaced from a connector. It does not
 * carry proof on its own — Evidence collection (Story 2) is what substantiates it.
 * Detecting a signal always emits SignalEvents.Detected so downstream consumers
 * (evidence collection, graph sync) can react without polling.
 */
export class SignalService {
  constructor(private readonly repository: SignalRepositoryPort) {}

  async detect(input: CreateSignalInput): Promise<Signal> {
    const signal = await this.repository.create(input);
    await eventBus.publish({
      type: SignalEvents.Detected,
      tenantId: signal.tenantId,
      entityType: 'Signal',
      entityId: signal.id,
      actorId: input.createdBy,
      payload: { signal },
    });
    return signal;
  }

  async get(tenantId: string, id: string): Promise<Signal | null> {
    return this.repository.findById(tenantId, id);
  }

  async list(tenantId: string, orgId?: string, status?: SignalStatus, source?: SignalSource): Promise<Signal[]> {
    return this.repository.list(tenantId, orgId, status, source);
  }

  async changeStatus(tenantId: string, id: string, status: SignalStatus, actorId: string): Promise<Signal | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    const updated = await this.repository.updateStatus(tenantId, id, { status });
    if (!updated) return null;
    await eventBus.publish({
      type: SignalEvents.StatusChanged,
      tenantId: updated.tenantId,
      entityType: 'Signal',
      entityId: updated.id,
      actorId,
      payload: { from: existing.status, to: updated.status, signal: updated },
    });
    return updated;
  }
}
