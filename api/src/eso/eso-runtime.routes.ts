import { Router, type Response } from 'express';
import { z } from 'zod';
import { EsoRuntimeService } from './eso-runtime.service.js';
import { EsoExecutionRepository, EvidenceRepository, ESO_EXECUTION_STATUSES } from '@hpbrain/database';
import { evaluateExecution } from './execution-evaluation.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const queueSchema = z.object({
  tenantId: z.string().min(1),
  esoId: z.string().min(1),
  decisionId: z.string().min(1).optional(),
  executorType: z.string().min(1),
  input: z.record(z.unknown()).optional(),
});

const transitionSchema = z.object({
  status: z.enum(ESO_EXECUTION_STATUSES),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

const defaultRepo = new EsoExecutionRepository();

export function esoRuntimeRoutes(service = new EsoRuntimeService(defaultRepo)): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = queueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const execution = await service.execute({ ...parsed.data, executedBy: req.user!.id });
    return res.status(201).json(execution);
  });

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const status = req.query.status as any;
    return res.json(await service.listAll(req.params.tenantId, status));
  });

  router.get('/:tenantId/eso/:esoId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await service.history(req.params.tenantId, req.params.esoId));
  });

  router.patch('/:tenantId/:id/transition', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = transitionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    try {
      const updated = await service.transition(req.params.tenantId, req.params.id, parsed.data.status, req.user!.id, {
        output: parsed.data.output, error: parsed.data.error,
      });
      return res.json(updated);
    } catch (e: any) {
      if (e.message === 'execution_not_found') return res.status(404).json({ error: 'not_found' });
      if (e.message.startsWith('invalid_transition')) return res.status(409).json({ error: e.message });
      throw e;
    }
  });

  router.post('/:tenantId/:id/rollback', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await service.rollback(req.params.tenantId, req.params.id, req.user!.id);
      return res.json(updated);
    } catch (e: any) {
      if (e.message === 'execution_not_found') return res.status(404).json({ error: 'not_found' });
      if (e.message.startsWith('invalid_transition')) return res.status(409).json({ error: e.message });
      throw e;
    }
  });

  // Evidence linkage (ESO Engine sprint) — reuses the existing Evidence entity.
  router.post('/:tenantId/:id/evidence', async (req: AuthenticatedRequest, res: Response) => {
    const evidenceId = req.body?.evidenceId;
    if (typeof evidenceId !== 'string' || !evidenceId) return res.status(400).json({ error: 'evidenceId_required' });
    await defaultRepo.linkEvidence(req.params.tenantId, req.params.id, evidenceId);
    return res.status(201).json({ linked: true });
  });

  // Execution Evaluation (ESO Engine sprint) — real, deterministic score for one execution.
  router.get('/:tenantId/:id/evaluate', async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, id } = req.params;
    const execution = await defaultRepo.findById(tenantId, id);
    if (!execution) return res.status(404).json({ error: 'not_found' });
    const evidenceIds = await defaultRepo.getLinkedEvidenceIds(tenantId, id);
    const evidenceRepo = new EvidenceRepository();
    const linkedEvidence = (await Promise.all(evidenceIds.map((eid) => evidenceRepo.findById(tenantId, eid)))).filter((e): e is NonNullable<typeof e> => e !== null);
    return res.json(evaluateExecution(execution, linkedEvidence));
  });

  return router;
}

export default esoRuntimeRoutes;
