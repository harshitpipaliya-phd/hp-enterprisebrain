import type { Hypothesis, ProposeHypothesisInput } from '@hpbrain/database';
import { eventBus, HypothesisEvents } from '@hpbrain/events';
import type { CaseService } from '../case/case.service.js';

export interface HypothesisRepositoryPort {
  propose: (input: ProposeHypothesisInput) => Promise<Hypothesis>;
  recordOutcome: (
    tenantId: string, caseId: string, originalHypothesisId: string,
    status: 'supported' | 'rejected' | 'confirmed', proposedBy: string,
    rejectedReason?: string, additionalEvidenceIds?: string[]
  ) => Promise<Hypothesis>;
  findById: (tenantId: string, id: string) => Promise<Hypothesis | null>;
  findByCase: (tenantId: string, caseId: string) => Promise<Hypothesis[]>;
}

/**
 * Hypothesis Ledger service (EPIC-004 F-004.2/F-004.3) — this is the actual
 * "Deliberation Loop" from the MVP spec §8. Not a new paradigm: propose a
 * hypothesis against one of the 8 root-cause families, test it against
 * evidence, and either support, reject (recording why), or confirm it. A
 * confirmed hypothesis resolves the case. The full sequence — including
 * every rejected hypothesis and why — stays in the ledger permanently,
 * because "the brain shows its differential, is watched rejecting a
 * hypothesis on probe evidence" (§12.3) only works if nothing is erased.
 */
export class HypothesisService {
  constructor(
    private readonly repository: HypothesisRepositoryPort,
    private readonly cases: CaseService
  ) {}

  async propose(input: ProposeHypothesisInput): Promise<Hypothesis> {
    const hypothesis = await this.repository.propose(input);
    const caseRecord = await this.cases.get(input.tenantId, input.caseId);
    if (caseRecord && caseRecord.status === 'investigating') {
      await this.cases.transition(input.tenantId, input.caseId, 'hypothesized', input.proposedBy);
    }
    await eventBus.publish({
      type: HypothesisEvents.Proposed,
      tenantId: hypothesis.tenantId,
      entityType: 'Hypothesis',
      entityId: hypothesis.id,
      actorId: input.proposedBy,
      payload: { hypothesis },
    });
    return hypothesis;
  }

  async reject(tenantId: string, caseId: string, hypothesisId: string, reason: string, actorId: string, additionalEvidenceIds?: string[]): Promise<Hypothesis> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('rejection_requires_reason');
    }
    const rejected = await this.repository.recordOutcome(tenantId, caseId, hypothesisId, 'rejected', actorId, reason, additionalEvidenceIds);
    await eventBus.publish({
      type: HypothesisEvents.Rejected,
      tenantId,
      entityType: 'Hypothesis',
      entityId: rejected.id,
      actorId,
      payload: { hypothesis: rejected, reason },
    });
    return rejected;
  }

  async support(tenantId: string, caseId: string, hypothesisId: string, actorId: string, additionalEvidenceIds?: string[]): Promise<Hypothesis> {
    const supported = await this.repository.recordOutcome(tenantId, caseId, hypothesisId, 'supported', actorId, undefined, additionalEvidenceIds);
    await eventBus.publish({
      type: HypothesisEvents.Supported,
      tenantId,
      entityType: 'Hypothesis',
      entityId: supported.id,
      actorId,
      payload: { hypothesis: supported },
    });
    return supported;
  }

  async confirm(tenantId: string, caseId: string, hypothesisId: string, actorId: string): Promise<Hypothesis> {
    const confirmed = await this.repository.recordOutcome(tenantId, caseId, hypothesisId, 'confirmed', actorId);
    await this.cases.transition(tenantId, caseId, 'resolved', actorId, confirmed.id);
    await eventBus.publish({
      type: HypothesisEvents.Confirmed,
      tenantId,
      entityType: 'Hypothesis',
      entityId: confirmed.id,
      actorId,
      payload: { hypothesis: confirmed },
    });
    return confirmed;
  }

  async ledger(tenantId: string, caseId: string): Promise<Hypothesis[]> {
    return this.repository.findByCase(tenantId, caseId);
  }
}
