import { Router } from 'express';
import { z } from 'zod';
import { OutcomeService } from './outcome.service.js';
import { OutcomeRepository, OUTCOME_RESULTS } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const captureSchema = z.object({
    tenantId: z.string().min(1),
    decisionId: z.string().min(1).optional(),
    result: z.enum(OUTCOME_RESULTS),
    metrics: z.record(z.unknown()).optional(),
    kpis: z.record(z.unknown()).optional(),
    evidenceIds: z.array(z.string()).optional(),
    feedback: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
});
const defaultRepo = new OutcomeRepository();
export function outcomeRoutes(service = new OutcomeService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = captureSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const outcome = await service.capture({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(outcome);
    });
    router.get('/:tenantId', async (req, res) => {
        return res.json(await service.list(req.params.tenantId));
    });
    router.get('/:tenantId/decision/:decisionId', async (req, res) => {
        return res.json(await service.forDecision(req.params.tenantId, req.params.decisionId));
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const outcome = await service.get(req.params.tenantId, req.params.id);
        if (!outcome)
            return res.status(404).json({ error: 'not_found' });
        return res.json(outcome);
    });
    return router;
}
export default outcomeRoutes;
