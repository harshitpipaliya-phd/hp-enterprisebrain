import { Router, type Response } from 'express';
import {
  SignalRepository, EvidenceRepository, ReasoningStepRepository,
  RecommendationRepository, DecisionRepository, OutcomeRepository, LearningRepository,
} from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const signals = new SignalRepository();
const evidence = new EvidenceRepository();
const reasoning = new ReasoningStepRepository();
const recommendations = new RecommendationRepository();
const decisions = new DecisionRepository();
const outcomes = new OutcomeRepository();
const learnings = new LearningRepository();

/**
 * Enterprise Intelligence Workspace (Sprint 2 Story 9).
 * Aggregates the whole Signal -> Evidence -> Reasoning -> Recommendation ->
 * Decision -> Outcome -> Learning chain for a tenant into one read model, so the
 * primary screen isn't assembling seven separate fetches client-side.
 */
export function workspaceRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.params.tenantId;
    const [sigs, recs, decs, outs, learns] = await Promise.all([
      signals.list(tenantId),
      recommendations.list(tenantId),
      decisions.list(tenantId),
      outcomes.list(tenantId),
      learnings.list(tenantId),
    ]);

    return res.json({
      tenantId,
      counts: {
        signals: sigs.length,
        recommendations: recs.length,
        decisions: decs.length,
        outcomes: outs.length,
        learnings: learns.length,
      },
      pendingRecommendations: recs.filter((r) => r.status === 'pending'),
      recentSignals: sigs.slice(0, 10),
      recentDecisions: decs.slice(0, 10),
      recentOutcomes: outs.slice(0, 10),
      reusableLearnings: learns.filter((l) => l.reusable).slice(0, 10),
    });
  });

  router.get('/:tenantId/signal/:signalId/chain', async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, signalId } = req.params;
    const [sig, ev, steps] = await Promise.all([
      signals.findById(tenantId, signalId),
      evidence.findBySignal(tenantId, signalId),
      reasoning.findBySignal(tenantId, signalId),
    ]);
    if (!sig) return res.status(404).json({ error: 'not_found' });
    return res.json({ signal: sig, evidence: ev, reasoningSteps: steps });
  });

  return router;
}

export default workspaceRoutes;
