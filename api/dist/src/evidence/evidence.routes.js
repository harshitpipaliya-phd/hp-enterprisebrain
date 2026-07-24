import { Router } from 'express';
import { z } from 'zod';
import { EvidenceService } from './evidence.service.js';
import { EvidenceRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createSchema = z.object({
    tenantId: z.string().min(1),
    signalId: z.string().min(1).optional(),
    source: z.string().min(1),
    evidenceType: z.string().max(50).optional(),
    content: z.record(z.unknown()),
    provenance: z.record(z.unknown()),
    confidence: z.number().min(0).max(1).optional(),
});
const defaultRepo = new EvidenceRepository();
export function evidenceRoutes(service = new EvidenceService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const evidence = await service.collect({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(evidence);
    });
    router.get('/:tenantId', async (req, res) => {
        const evidence = await service.list(req.params.tenantId, req.query.source);
        return res.json(evidence);
    });
    router.get('/:tenantId/signal/:signalId', async (req, res) => {
        const evidence = await service.forSignal(req.params.tenantId, req.params.signalId);
        return res.json(evidence);
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const evidence = await service.get(req.params.tenantId, req.params.id);
        if (!evidence)
            return res.status(404).json({ error: 'not_found' });
        return res.json(evidence);
    });
    return router;
}
export default evidenceRoutes;
