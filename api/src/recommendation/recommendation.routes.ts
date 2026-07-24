import { Router, type Response } from 'express';
import { z } from 'zod';
import { RecommendationService } from './recommendation.service.js';
import { RecommendationRepository, ReasoningStepRepository, EvidenceRepository, MentalModelRepository, PolicyRepository, RECOMMENDATION_CATEGORIES } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const generateSchema = z.object({
  tenantId: z.string().min(1),
  reasoningStepId: z.string().min(1),
  category: z.enum(RECOMMENDATION_CATEGORIES),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  impact: z.string().optional(),
  cost: z.string().optional(),
  risk: z.string().optional(),
  dependencies: z.array(z.unknown()).optional(),
});

const statusSchema = z.object({ status: z.enum(['pending', 'approved', 'rejected']) });

const defaultRepo = new RecommendationRepository();
const defaultReasoningRepo = new ReasoningStepRepository();

export function recommendationRoutes(service = new RecommendationService(defaultRepo, defaultReasoningRepo)): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    try {
      const rec = await service.generate({ ...parsed.data, createdBy: req.user!.id });
      return res.status(201).json(rec);
    } catch (e: any) {
      if (e.message === 'reasoning_step_not_found') return res.status(404).json({ error: 'reasoning_step_not_found' });
      throw e;
    }
  });

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const recs = await service.list(req.params.tenantId, req.query.status as string | undefined);
    return res.json(recs);
  });

  router.get('/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const rec = await service.get(req.params.tenantId, req.params.id);
    if (!rec) return res.status(404).json({ error: 'not_found' });
    return res.json(rec);
  });

  /**
   * Explainability (Digital Twin Sprint, Part 8). Real aggregation: the
   * reasoning chain (ReasoningStep -> Evidence via the signal it's attached
   * to), any Policy whose rules reference this recommendation's category,
   * and the Mental Model for this category as a best-effort domain match —
   * named as a heuristic in the response, not a guaranteed link, since
   * Recommendation and MentalModel share no explicit foreign key.
   */
  router.get('/:tenantId/:id/explain', async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, id } = req.params;
    const rec = await service.get(tenantId, id);
    if (!rec) return res.status(404).json({ error: 'not_found' });

    const reasoningStep = rec.reasoningStepId ? await new ReasoningStepRepository().findById(tenantId, rec.reasoningStepId) : null;
    const evidence = reasoningStep?.signalId ? await new EvidenceRepository().findBySignal(tenantId, reasoningStep.signalId) : [];
    const allPolicies = await new PolicyRepository().list(tenantId);
    const relevantPolicies = allPolicies.filter((p) =>
      p.rules.some((r: any) => (r.field === 'recommendation.category' && r.value === rec.category) || r.conditions?.some((c: any) => c.field === 'recommendation.category' && c.value === rec.category))
    );
    const mentalModel = await new MentalModelRepository().findActiveByDomain(tenantId, rec.category);

    return res.json({
      recommendation: rec,
      reasoningChain: reasoningStep,
      supportingEvidence: evidence,
      influencingPolicies: relevantPolicies.map((p) => ({ id: p.id, name: p.name, policyType: p.policyType })),
      relevantMentalModel: mentalModel ? { domain: mentalModel.domain, confidence: mentalModel.confidence, reinforcementCount: mentalModel.reinforcementCount } : null,
      mentalModelMatchNote: 'Matched by category as a best-effort domain heuristic — Recommendation and MentalModel have no explicit foreign key linking them.',
    });
  });

  router.patch('/:tenantId/:id/status', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const updated = await service.changeStatus(req.params.tenantId, req.params.id, parsed.data.status, req.user!.id);
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.json(updated);
  });

  return router;
}

export default recommendationRoutes;
