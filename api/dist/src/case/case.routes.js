import { Router } from 'express';
import { z } from 'zod';
import { CaseService } from './case.service.js';
import { CaseRepository, CASE_STATUSES } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createSchema = z.object({
    tenantId: z.string().min(1),
    signalId: z.string().min(1).optional(),
    title: z.string().min(1),
    description: z.string().optional(),
});
const transitionSchema = z.object({
    status: z.enum(CASE_STATUSES),
    resolvedHypothesisId: z.string().optional(),
});
const evidenceSchema = z.object({ evidenceId: z.string().min(1) });
const defaultRepo = new CaseRepository();
export function caseRoutes(service = new CaseService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const created = await service.open({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(created);
    });
    router.get('/:tenantId', async (req, res) => {
        return res.json(await service.list(req.params.tenantId, req.query.status));
    });
    router.get('/:tenantId/signal/:signalId', async (req, res) => {
        return res.json(await service.forSignal(req.params.tenantId, req.params.signalId));
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const found = await service.get(req.params.tenantId, req.params.id);
        if (!found)
            return res.status(404).json({ error: 'not_found' });
        return res.json(found);
    });
    router.patch('/:tenantId/:id/transition', async (req, res) => {
        const parsed = transitionSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        try {
            const updated = await service.transition(req.params.tenantId, req.params.id, parsed.data.status, req.user.id, parsed.data.resolvedHypothesisId);
            return res.json(updated);
        }
        catch (e) {
            if (e.message === 'case_not_found')
                return res.status(404).json({ error: 'not_found' });
            if (e.message.startsWith('invalid_transition') || e.message === 'resolved_requires_hypothesis')
                return res.status(409).json({ error: e.message });
            throw e;
        }
    });
    router.post('/:tenantId/:id/evidence', async (req, res) => {
        const parsed = evidenceSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        try {
            await service.attachEvidence(req.params.tenantId, req.params.id, parsed.data.evidenceId, req.user.id);
            return res.status(201).json({ linked: true });
        }
        catch (e) {
            if (e.message === 'case_not_found')
                return res.status(404).json({ error: 'not_found' });
            throw e;
        }
    });
    router.get('/:tenantId/:id/evidence', async (req, res) => {
        return res.json(await service.linkedEvidence(req.params.tenantId, req.params.id));
    });
    return router;
}
export default caseRoutes;
