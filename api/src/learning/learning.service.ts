import type { Learning, Outcome } from '@hpbrain/database';
import { eventBus, LearningEvents } from '@hpbrain/events';
import { anonymize, generalize } from './anonymize.js';
import type { MentalModelService } from '../mental-model/mental-model.service.js';

export interface LearningRepositoryPort {
  create: (input: {
    tenantId: string; outcomeId?: string | null; mentalModelId?: string | null;
    pattern: string; description?: string | null; confidence?: number; reusable?: boolean; createdBy: string;
  }) => Promise<Learning>;
  list: (tenantId: string) => Promise<Learning[]>;
  findReusable: (tenantId: string) => Promise<Learning[]>;
}

export interface OutcomeLookupPort {
  findById: (tenantId: string, id: string) => Promise<Outcome | null>;
}

export interface ExtractInput {
  tenantId: string;
  outcomeId: string;
  mentalModelId?: string | null;
  domain?: string;
  pattern: string;
  description?: string;
  createdBy: string;
}

/**
 * Learning Engine (Sprint 2 Story 8, extended Sprint 5 with Mental Model
 * reinforcement).
 * A successful outcome with reasonable confidence becomes reusable organizational
 * knowledge; a failed or low-confidence outcome is still recorded (the loop must
 * learn from failure too) but is not marked reusable, so it won't be surfaced as a
 * pattern to repeat.
 *
 * When reusable and a `domain` is given, the (anonymized, generalized) pattern
 * doesn't just sit in the append-only Learning ledger — it reinforces the
 * organization's Mental Model for that domain, closing the loop that Sprint 2's
 * graph relationships declared but never implemented.
 */
export class LearningService {
  constructor(
    private readonly repository: LearningRepositoryPort,
    private readonly outcomeLookup: OutcomeLookupPort,
    private readonly mentalModels?: MentalModelService
  ) {}

  async extract(input: ExtractInput): Promise<Learning> {
    const outcome = await this.outcomeLookup.findById(input.tenantId, input.outcomeId);
    if (!outcome) throw new Error('outcome_not_found');

    const reusable = outcome.result === 'success' && outcome.confidence >= 0.5;

    // DPDP-compliant: strip identifiers and generalize named entities before a
    // pattern becomes permanent reusable organizational knowledge.
    const anonymizedPattern = anonymize(input.pattern);
    const generalizedPattern = generalize(anonymizedPattern.text);
    const anonymizedDescription = input.description ? anonymize(input.description).text : null;
    const totalRedactions = anonymizedPattern.redactionCount + generalizedPattern.redactionCount;

    let mentalModelId = input.mentalModelId ?? null;
    if (reusable && input.domain && this.mentalModels) {
      const model = await this.mentalModels.reinforceFromLearning(
        input.tenantId, input.domain, generalizedPattern.text, outcome.confidence, input.createdBy
      );
      mentalModelId = model.id;
    }

    const learning = await this.repository.create({
      tenantId: input.tenantId,
      outcomeId: outcome.id,
      mentalModelId,
      pattern: generalizedPattern.text,
      description: anonymizedDescription,
      confidence: outcome.confidence,
      reusable,
      createdBy: input.createdBy,
    });

    await eventBus.publish({
      type: LearningEvents.Extracted,
      tenantId: learning.tenantId,
      entityType: 'Learning',
      entityId: learning.id,
      actorId: input.createdBy,
      payload: { learning, outcome, redactionsApplied: totalRedactions },
    });
    return learning;
  }

  async list(tenantId: string): Promise<Learning[]> {
    return this.repository.list(tenantId);
  }

  async reusable(tenantId: string): Promise<Learning[]> {
    return this.repository.findReusable(tenantId);
  }
}
