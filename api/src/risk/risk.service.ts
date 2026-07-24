import type { Risk, CreateRiskInput, RiskImpact } from '@hpbrain/database';
import { eventBus, RiskEvents } from '@hpbrain/events';

export interface RiskRepositoryPort {
  create: (input: CreateRiskInput & { score: number }) => Promise<Risk>;
  findById: (tenantId: string, id: string) => Promise<Risk | null>;
  findByDecision: (tenantId: string, decisionId: string) => Promise<Risk[]>;
  list: (tenantId: string, status?: Risk['status']) => Promise<Risk[]>;
  mitigate: (tenantId: string, id: string, mitigation: string) => Promise<Risk | null>;
}

const IMPACT_WEIGHT: Record<RiskImpact, number> = { low: 1, medium: 2.5, high: 5, critical: 10 };

/**
 * Risk Engine (Sprint 4 Story 6). New entity — Risk was never part of any prior
 * canonical entity list. Score is deterministic (probability x impact weight),
 * not asserted, so two risks with the same category/impact don't silently drift
 * to different scores based on who entered them.
 */
export class RiskService {
  constructor(private readonly repository: RiskRepositoryPort) {}

  computeScore(probability: number, impact: RiskImpact): number {
    return Number((probability * IMPACT_WEIGHT[impact]).toFixed(2));
  }

  async assess(input: CreateRiskInput): Promise<Risk> {
    const score = this.computeScore(input.probability, input.impact);
    const risk = await this.repository.create({ ...input, score });
    await eventBus.publish({
      type: RiskEvents.Assessed,
      tenantId: risk.tenantId,
      entityType: 'Risk',
      entityId: risk.id,
      actorId: input.createdBy,
      payload: { risk },
    });
    return risk;
  }

  async mitigate(tenantId: string, id: string, mitigation: string, actorId: string): Promise<Risk> {
    const updated = await this.repository.mitigate(tenantId, id, mitigation);
    if (!updated) throw new Error('risk_not_found');
    await eventBus.publish({
      type: RiskEvents.Mitigated,
      tenantId: updated.tenantId,
      entityType: 'Risk',
      entityId: updated.id,
      actorId,
      payload: { risk: updated },
    });
    return updated;
  }

  async get(tenantId: string, id: string): Promise<Risk | null> {
    return this.repository.findById(tenantId, id);
  }

  async forDecision(tenantId: string, decisionId: string): Promise<Risk[]> {
    return this.repository.findByDecision(tenantId, decisionId);
  }

  async list(tenantId: string, status?: Risk['status']): Promise<Risk[]> {
    return this.repository.list(tenantId, status);
  }
}
