import { Router } from 'express';
import { z } from 'zod';
import { HypothesisService } from './hypothesis.service.js';
import { CaseService } from './case.service.js';
import { HypothesisRepository, CaseRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const ROOT_CAUSE_FAMILIES = ['Capability', 'Capacity', 'Process', 'Information', 'Motivation', 'Coordination', 'External', 'Policy'];
const proposeSchema = z.object({
    tenantId: z.string().min(1),
    caseId: z.string().min(1),
    statement: z.string().min(1),
    rootCauseFamily: z.enum(ROOT_CAUSE_FAMILIES),
    confidence: z.number().min(0).max(1).optional(),
    supportingEvidenceIds: z.array(z.string()).optional(),
});
const rejectSchema = z.object({ reason: z.string().min(1), additionalEvidenceIds: z.array(z.string()).optional() });
const outcomeSchema = z.object({ additionalEvidenceIds: z.array(z.string()).optional() });
const defaultCaseRepo = new CaseRepository();
const defaultCaseService = new CaseService(defaultCaseRepo);
const defaultHypothesisRepo = new HypothesisRepository();
export function hypothesisRoutes(service = new HypothesisService(defaultHypothesisRepo, defaultCaseService)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = proposeSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const hypothesis = await service.propose({ ...parsed.data, proposedBy: req.user.id });
        return res.status(201).json(hypothesis);
    });
    router.get('/:tenantId/case/:caseId', async (req, res) => {
        return res.json(await service.ledger(req.params.tenantId, req.params.caseId));
    });
    router.post('/:tenantId/case/:caseId/:id/reject', async (req, res) => {
        const parsed = rejectSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        try {
            const rejected = await service.reject(req.params.tenantId, req.params.caseId, req.params.id, parsed.data.reason, req.user.id, parsed.data.additionalEvidenceIds);
            return res.status(201).json(rejected);
        }
        catch (e) {
            if (e.message === 'hypothesis_not_found')
                return res.status(404).json({ error: 'not_found' });
            if (e.message === 'rejection_requires_reason')
                return res.status(400).json({ error: e.message });
            throw e;
        }
    });
    router.post('/:tenantId/case/:caseId/:id/support', async (req, res) => {
        const parsed = outcomeSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        try {
            const supported = await service.support(req.params.tenantId, req.params.caseId, req.params.id, req.user.id, parsed.data.additionalEvidenceIds);
            return res.status(201).json(supported);
        }
        catch (e) {
            if (e.message === 'hypothesis_not_found')
                return res.status(404).json({ error: 'not_found' });
            throw e;
        }
    });
    router.post('/:tenantId/case/:caseId/:id/confirm', async (req, res) => {
        try {
            const confirmed = await service.confirm(req.params.tenantId, req.params.caseId, req.params.id, req.user.id);
            return res.status(201).json(confirmed);
        }
        catch (e) {
            if (e.message === 'hypothesis_not_found')
                return res.status(404).json({ error: 'not_found' });
            throw e;
        }
    });
    return router;
}
export default hypothesisRoutes;
