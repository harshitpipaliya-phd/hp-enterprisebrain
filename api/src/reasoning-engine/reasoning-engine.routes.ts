import { Router, type Response } from 'express';
import { detectMissingEvidence, detectDuplicateSignals, detectUnaddressedHighSeveritySignals } from './checks.js';
import { SignalRepository, EvidenceRepository, RecommendationRepository, ReasoningStepRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const signals = new SignalRepository();
const evidence = new EvidenceRepository();

/** Shared by both early-warnings routes below — the set of signalIds that already have a Recommendation, so neither route duplicates this lookup. */
async function getSignalIdsWithRecommendations(tenantId: string): Promise<Set<string>> {
  const allRecommendations = await new RecommendationRepository().list(tenantId);
  const reasoningSteps = new ReasoningStepRepository();
  const signalIdsWithRecommendations = new Set<string>();
  for (const rec of allRecommendations) {
    if (!rec.reasoningStepId) continue;
    const step = await reasoningSteps.findById(tenantId, rec.reasoningStepId);
    if (step?.signalId) signalIdsWithRecommendations.add(step.signalId);
  }
  return signalIdsWithRecommendations;
}

export function reasoningEngineRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.get('/:tenantId/missing-evidence', async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.params.tenantId;
    const [allSignals, allEvidence] = await Promise.all([signals.list(tenantId), evidence.list(tenantId)]);
    const evidenceSignalIds = new Set(allEvidence.map((e) => e.signalId).filter((id): id is string => !!id));
    const findings = detectMissingEvidence(allSignals, evidenceSignalIds);
    return res.json({ findings, count: findings.length });
  });

  router.get('/:tenantId/duplicate-signals', async (req: AuthenticatedRequest, res: Response) => {
    const allSignals = await signals.list(req.params.tenantId);
    const findings = detectDuplicateSignals(allSignals);
    return res.json({ findings, count: findings.length });
  });

  /**
   * Early Warning (Student Intelligence MVP milestone, Part 5). Real,
   * deterministic — flags high/critical-severity open signals with no
   * downstream Recommendation. "Evidence for every alert" is the signal's
   * own real fields, not a generated explanation.
   */
  router.get('/:tenantId/early-warnings', async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.params.tenantId;
    const [allSignals, signalIdsWithRecommendations] = await Promise.all([signals.list(tenantId), getSignalIdsWithRecommendations(tenantId)]);
    const findings = detectUnaddressedHighSeveritySignals(allSignals, signalIdsWithRecommendations);
    return res.json({ findings, count: findings.length });
  });

  /**
   * Risk Indicators for one student (Parent Intelligence MVP milestone,
   * remaining item from Part 1). Same detection function and same shared
   * lookup as early-warnings above, scoped to one student — no duplicated
   * logic between the two routes.
   */
  router.get('/:tenantId/student/:studentPersonId/risk-indicators', async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, studentPersonId } = req.params;
    const [allSignals, signalIdsWithRecommendations] = await Promise.all([signals.list(tenantId), getSignalIdsWithRecommendations(tenantId)]);
    const studentSignals = allSignals.filter((s) => s.relatedEntityType === 'Person' && s.relatedEntityId === studentPersonId);
    const findings = detectUnaddressedHighSeveritySignals(studentSignals, signalIdsWithRecommendations);
    return res.json({ findings, count: findings.length });
  });

  return router;
}

export default reasoningEngineRoutes;
