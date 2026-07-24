import { Router, type Response } from 'express';
import { z } from 'zod';
import { AccreditationRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const createFrameworkSchema = z.object({ tenantId: z.string().min(1), name: z.string().min(1), cycleLabel: z.string().optional() });
const createCriterionSchema = z.object({ tenantId: z.string().min(1), frameworkId: z.string().min(1), criterionCode: z.string().min(1), description: z.string().min(1) });
const linkEvidenceSchema = z.object({ evidenceId: z.string().min(1) });
const setStatusSchema = z.object({ status: z.enum(['not_started', 'in_progress', 'evidence_complete', 'submitted']) });

const repo = new AccreditationRepository();

export function accreditationRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/frameworks', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createFrameworkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const framework = await repo.createFramework(parsed.data.tenantId, parsed.data.name, parsed.data.cycleLabel, req.user!.id);
    return res.status(201).json(framework);
  });

  router.get('/frameworks/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await repo.listFrameworks(req.params.tenantId));
  });

  router.post('/criteria', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createCriterionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const criterion = await repo.createCriterion(parsed.data.tenantId, parsed.data.frameworkId, parsed.data.criterionCode, parsed.data.description, req.user!.id);
    return res.status(201).json(criterion);
  });

  router.get('/criteria/:tenantId/framework/:frameworkId', async (req: AuthenticatedRequest, res: Response) => {
    const criteria = await repo.listCriteria(req.params.tenantId, req.params.frameworkId);
    const withEvidenceCounts = await Promise.all(criteria.map(async (c) => ({ ...c, evidenceCount: await repo.getLinkedEvidenceCount(req.params.tenantId, c.id) })));
    return res.json(withEvidenceCounts);
  });

  router.post('/criteria/:tenantId/:id/evidence', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = linkEvidenceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    await repo.linkEvidence(req.params.tenantId, req.params.id, parsed.data.evidenceId);
    return res.status(201).json({ linked: true });
  });

  router.patch('/criteria/:tenantId/:id/status', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = setStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const criterion = await repo.setStatus(req.params.tenantId, req.params.id, parsed.data.status);
    if (!criterion) return res.status(404).json({ error: 'not_found' });
    return res.json(criterion);
  });

  return router;
}

export default accreditationRoutes;
