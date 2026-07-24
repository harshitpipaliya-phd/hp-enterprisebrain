import { Router } from 'express';
import { z } from 'zod';
import { ReasoningService } from './reasoning.service.js';
import { ReasoningStepRepository, EvidenceRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const reasonSchema = z.object({
    tenantId: z.string().min(1),
    signalId: z.string().min(1),
    caseId: z.string().min(1).optional(),
    mentalModelId: z.string().min(1).optional(),
    description: z.string().min(1),
});
const defaultRepo = new ReasoningStepRepository();
const defaultEvidenceRepo = new EvidenceRepository();
export function reasoningRoutes(service = new ReasoningService(defaultRepo, defaultEvidenceRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = reasonSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const step = await service.reason({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(step);
    });
    router.get('/:tenantId/signal/:signalId', async (req, res) => {
        const steps = await service.forSignal(req.params.tenantId, req.params.signalId);
        return res.json(steps);
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const step = await service.get(req.params.tenantId, req.params.id);
        if (!step)
            return res.status(404).json({ error: 'not_found' });
        return res.json(step);
    });
    return router;
}
export default reasoningRoutes;
