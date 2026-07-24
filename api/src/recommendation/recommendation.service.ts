import type { Recommendation, CreateRecommendationInput, RecommendationCategory, ReasoningStep } from '@hpbrain/database';
import { eventBus, RecommendationEvents } from '@hpbrain/events';

export interface RecommendationRepositoryPort {
  create: (input: CreateRecommendationInput) => Promise<Recommendation>;
  findById: (tenantId: string, id: string) => Promise<Recommendation | null>;
  list: (tenantId: string, status?: string) => Promise<Recommendation[]>;
  updateStatus: (tenantId: string, id: string, status: string) => Promise<Recommendation | null>;
}

export interface ReasoningLookupPort {
  findById: (tenantId: string, id: string) => Promise<ReasoningStep | null>;
}

export interface GenerateInput {
  tenantId: string;
  reasoningStepId: string;
  category: RecommendationCategory;
  title: string;
  description?: string;
  impact?: string;
  expectedRoi?: number;
  cost?: string;
  risk?: string;
  dependencies?: unknown[];
  createdBy: string;
}

const LOW_CONFIDENCE_THRESHOLD = 0.4;

/**
 * Recommendation Engine (Sprint 2 Story 4, extended Sprint 4 Story 4 with
 * urgency + expected ROI).
 * A recommendation's confidence is inherited from the ReasoningStep it's generated
 * from. Below the low-confidence threshold, the category is forced to 'watch'
 * regardless of what the caller requested — matching the agreed rule that
 * external-only, uncorroborated intelligence must never present as a firm claim.
 * Urgency is derived, not caller-supplied: a 'risk' category at high confidence is
 * urgent by nature; an 'opportunity' at the same confidence is not — a territory
 * expansion can wait a news cycle, an unresolved compliance risk cannot.
 */
export class RecommendationService {
  constructor(
    private readonly repository: RecommendationRepositoryPort,
    private readonly reasoningLookup: ReasoningLookupPort
  ) {}

  private deriveUrgency(category: RecommendationCategory, confidence: number): string {
    if (category === 'compliance' && confidence >= 0.6) return 'immediate';
    if (category === 'risk' && confidence >= 0.7) return 'high';
    if (category === 'watch') return 'low';
    return confidence >= 0.7 ? 'high' : 'normal';
  }

  async generate(input: GenerateInput): Promise<Recommendation> {
    const step = await this.reasoningLookup.findById(input.tenantId, input.reasoningStepId);
    if (!step) throw new Error('reasoning_step_not_found');

    const category: RecommendationCategory = step.confidenceScore < LOW_CONFIDENCE_THRESHOLD ? 'watch' : input.category;
    const priority = step.confidenceScore >= 0.7 ? 'high' : step.confidenceScore >= 0.4 ? 'medium' : 'low';
    const urgency = this.deriveUrgency(category, step.confidenceScore);

    const recommendation = await this.repository.create({
      tenantId: input.tenantId,
      reasoningStepId: step.id,
      category,
      title: input.title,
      description: input.description ?? null,
      priority,
      urgency,
      confidence: step.confidenceScore,
      impact: input.impact ?? null,
      expectedRoi: input.expectedRoi ?? null,
      cost: input.cost ?? null,
      risk: input.risk ?? null,
      dependencies: input.dependencies ?? [],
      createdBy: input.createdBy,
    });

    await eventBus.publish({
      type: RecommendationEvents.Generated,
      tenantId: recommendation.tenantId,
      entityType: 'Recommendation',
      entityId: recommendation.id,
      actorId: input.createdBy,
      payload: { recommendation },
    });
    return recommendation;
  }

  async get(tenantId: string, id: string): Promise<Recommendation | null> {
    return this.repository.findById(tenantId, id);
  }

  async list(tenantId: string, status?: string): Promise<Recommendation[]> {
    return this.repository.list(tenantId, status);
  }

  async changeStatus(tenantId: string, id: string, status: string, actorId: string): Promise<Recommendation | null> {
    const updated = await this.repository.updateStatus(tenantId, id, status);
    if (!updated) return null;
    await eventBus.publish({
      type: RecommendationEvents.StatusChanged,
      tenantId: updated.tenantId,
      entityType: 'Recommendation',
      entityId: updated.id,
      actorId,
      payload: { recommendation: updated },
    });
    return updated;
  }
}
