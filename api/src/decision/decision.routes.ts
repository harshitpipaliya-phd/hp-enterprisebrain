import { Router, type Response } from 'express';
import { z } from 'zod';
import { DecisionService } from './decision.service.js';
import { DecisionRepository, RecommendationRepository, PolicyRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const approveSchema = z.object({
  tenantId: z.string().min(1),
  recommendationId: z.string().min(1),
  rationale: z.string().min(1),
});

const defaultRepo = new DecisionRepository();
const defaultRecommendationRepo = new RecommendationRepository();
const defaultPolicyRepo = new PolicyRepository();

export function decisionRoutes(service = new DecisionService(defaultRepo, defaultRecommendationRepo, undefined, defaultPolicyRepo)): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    try {
      const decision = await service.approve({ ...parsed.data, decidedBy: req.user!.id });
      return res.status(201).json(decision);
    } catch (e: any) {
      if (e.message === 'recommendation_not_found') return res.status(404).json({ error: 'recommendation_not_found' });
      throw e;
    }
  });

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await service.list(req.params.tenantId));
  });

  router.get('/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const decision = await service.get(req.params.tenantId, req.params.id);
    if (!decision) return res.status(404).json({ error: 'not_found' });
    return res.json(decision);
  });

  router.post('/:tenantId/:recId/reject', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = z.object({ rationale: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    try {
      const decision = await service.reject({
        tenantId: req.params.tenantId, recommendationId: req.params.recId,
        decidedBy: req.user!.id, rationale: parsed.data.rationale,
      });
      return res.status(201).json(decision);
    } catch (e: any) {
      if (e.message === 'recommendation_not_found') return res.status(404).json({ error: 'recommendation_not_found' });
      throw e;
    }
  });

  // Sprint 6: Autonomous Decision Execution. Only acts if the tenant has an active
  // business_rule Policy whose evaluated actions include 'auto_approve' for this
  // recommendation. Never fires automatically on recommendation creation — must be
  // explicitly called, so autonomous approval stays inspectable, not a silent
  // background behavior change.
  router.post('/:tenantId/:recId/auto-approve-attempt', async (req: AuthenticatedRequest, res: Response) => {
    const decision = await service.tryAutoApprove(req.params.tenantId, req.params.recId);
    if (!decision) return res.json({ autoApproved: false });
    return res.status(201).json({ autoApproved: true, decision });
  });

  return router;
}

export default decisionRoutes;
