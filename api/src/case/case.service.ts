import type { Case, CaseStatus, CreateCaseInput } from '@hpbrain/database';
import { eventBus, CaseEvents } from '@hpbrain/events';

export interface CaseRepositoryPort {
  create: (input: CreateCaseInput) => Promise<Case>;
  findById: (tenantId: string, id: string) => Promise<Case | null>;
  findBySignal: (tenantId: string, signalId: string) => Promise<Case[]>;
  list: (tenantId: string, status?: CaseStatus) => Promise<Case[]>;
  transition: (tenantId: string, id: string, status: CaseStatus, resolvedHypothesisId?: string | null) => Promise<Case | null>;
  linkEvidence: (tenantId: string, caseId: string, evidenceId: string) => Promise<void>;
  getLinkedEvidenceIds: (tenantId: string, caseId: string) => Promise<string[]>;
}

// EPIC-004 F-004.4: open -> investigating -> hypothesized -> resolved -> closed.
const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  open: ['investigating'],
  investigating: ['hypothesized'],
  hypothesized: ['investigating', 'resolved'], // can return to investigating if a hypothesis is rejected and a new one is needed
  resolved: ['closed'],
  closed: [],
};

/**
 * Case Engine (EPIC-004). "A signal alone is not actionable" — the epic's own
 * business problem statement. This is the investigative thread: a case opens
 * from a signal, moves through hypothesis formation (HypothesisService owns
 * that ledger), and closes only once a hypothesis is confirmed and linked.
 */
export class CaseService {
  constructor(private readonly repository: CaseRepositoryPort) {}

  async open(input: CreateCaseInput): Promise<Case> {
    const created = await this.repository.create(input);
    await eventBus.publish({
      type: CaseEvents.Opened,
      tenantId: created.tenantId,
      entityType: 'Case',
      entityId: created.id,
      actorId: input.createdBy,
      payload: { case: created },
    });
    return created;
  }

  async transition(tenantId: string, id: string, status: CaseStatus, actorId: string, resolvedHypothesisId?: string): Promise<Case> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) throw new Error('case_not_found');
    if (!VALID_TRANSITIONS[existing.status].includes(status)) {
      throw new Error(`invalid_transition: ${existing.status} -> ${status}`);
    }
    if (status === 'resolved' && !resolvedHypothesisId) {
      throw new Error('resolved_requires_hypothesis');
    }
    const updated = await this.repository.transition(tenantId, id, status, resolvedHypothesisId ?? null);
    if (!updated) throw new Error('case_not_found');
    await eventBus.publish({
      type: CaseEvents.StatusChanged,
      tenantId: updated.tenantId,
      entityType: 'Case',
      entityId: updated.id,
      actorId,
      payload: { from: existing.status, to: updated.status, case: updated },
    });
    return updated;
  }

  async attachEvidence(tenantId: string, caseId: string, evidenceId: string, actorId: string): Promise<void> {
    const existing = await this.repository.findById(tenantId, caseId);
    if (!existing) throw new Error('case_not_found');
    await this.repository.linkEvidence(tenantId, caseId, evidenceId);
    await eventBus.publish({
      type: CaseEvents.EvidenceLinked,
      tenantId,
      entityType: 'Case',
      entityId: caseId,
      actorId,
      payload: { evidenceId },
    });
  }

  async get(tenantId: string, id: string): Promise<Case | null> {
    return this.repository.findById(tenantId, id);
  }

  async forSignal(tenantId: string, signalId: string): Promise<Case[]> {
    return this.repository.findBySignal(tenantId, signalId);
  }

  async list(tenantId: string, status?: CaseStatus): Promise<Case[]> {
    return this.repository.list(tenantId, status);
  }

  async linkedEvidence(tenantId: string, caseId: string): Promise<string[]> {
    return this.repository.getLinkedEvidenceIds(tenantId, caseId);
  }
}
