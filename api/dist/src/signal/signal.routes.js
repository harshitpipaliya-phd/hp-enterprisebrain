import { Router } from 'express';
import { z } from 'zod';
import { SignalService } from './signal.service.js';
import { SignalRepository, EvidenceRepository, ReasoningStepRepository, SIGNAL_SOURCES, SIGNAL_SEVERITIES, SIGNAL_STATUSES, SIGNAL_PRIORITIES } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createSchema = z.object({
    tenantId: z.string().min(1),
    orgId: z.string().min(1),
    source: z.enum(SIGNAL_SOURCES),
    classification: z.string().max(100).optional(),
    priority: z.enum(SIGNAL_PRIORITIES).optional(),
    severity: z.enum(SIGNAL_SEVERITIES).optional(),
    confidence: z.number().min(0).max(1).optional(),
    relatedEntityType: z.string().max(100).optional(),
    relatedEntityId: z.string().max(200).optional(),
    metadata: z.record(z.unknown()).optional(),
});
const statusSchema = z.object({
    status: z.enum(SIGNAL_STATUSES),
});
const defaultRepo = new SignalRepository();
const evidenceRepo = new EvidenceRepository();
const reasoningRepo = new ReasoningStepRepository();
export function signalRoutes(service = new SignalService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    // Signal detection is also invoked internally by connectors, not just this endpoint —
    // this route exists for manual/testing signal injection and for connectors that push
    // over HTTP rather than an in-process call.
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const signal = await service.detect({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(signal);
    });
    router.get('/:tenantId', async (req, res) => {
        const { orgId, status, source } = req.query;
        const signals = await service.list(req.params.tenantId, orgId, status, source);
        return res.json(signals);
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const signal = await service.get(req.params.tenantId, req.params.id);
        if (!signal)
            return res.status(404).json({ error: 'not_found' });
        return res.json(signal);
    });
    // Sprint 3 Story 1: Signal Timeline — the signal plus everything chained from it,
    // in chronological order, so a reviewer can see the whole story of one signal.
    router.get('/:tenantId/:id/timeline', async (req, res) => {
        const signal = await service.get(req.params.tenantId, req.params.id);
        if (!signal)
            return res.status(404).json({ error: 'not_found' });
        const [evidence, reasoningSteps] = await Promise.all([
            evidenceRepo.findBySignal(req.params.tenantId, req.params.id),
            reasoningRepo.findBySignal(req.params.tenantId, req.params.id),
        ]);
        const timeline = [
            { type: 'signal', timestamp: signal.createdDate, data: signal },
            ...evidence.map((e) => ({ type: 'evidence', timestamp: e.createdDate, data: e })),
            ...reasoningSteps.map((r) => ({ type: 'reasoning_step', timestamp: r.createdDate, data: r })),
        ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return res.json({ signal, timeline });
    });
    router.patch('/:tenantId/:id/status', async (req, res) => {
        const parsed = statusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const updated = await service.changeStatus(req.params.tenantId, req.params.id, parsed.data.status, req.user.id);
        if (!updated)
            return res.status(404).json({ error: 'not_found' });
        return res.json(updated);
    });
    return router;
}
export default signalRoutes;
