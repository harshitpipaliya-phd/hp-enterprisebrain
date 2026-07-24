import { Router } from 'express';
import { z } from 'zod';
import { LearningService } from './learning.service.js';
import { LearningRepository, OutcomeRepository, MentalModelRepository } from '@hpbrain/database';
import { MentalModelService } from '../mental-model/mental-model.service.js';
import { PatternDetectionService, suggestCapabilityGaps } from './pattern-detection.service.js';
import { CapabilityRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const extractSchema = z.object({
    tenantId: z.string().min(1),
    outcomeId: z.string().min(1),
    mentalModelId: z.string().min(1).optional(),
    domain: z.string().min(1).optional(),
    pattern: z.string().min(1),
    description: z.string().optional(),
});
const defaultRepo = new LearningRepository();
const defaultOutcomeRepo = new OutcomeRepository();
const defaultMentalModels = new MentalModelService(new MentalModelRepository());
export function learningRoutes(service = new LearningService(defaultRepo, defaultOutcomeRepo, defaultMentalModels)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = extractSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        try {
            const learning = await service.extract({ ...parsed.data, createdBy: req.user.id });
            return res.status(201).json(learning);
        }
        catch (e) {
            if (e.message === 'outcome_not_found')
                return res.status(404).json({ error: 'outcome_not_found' });
            throw e;
        }
    });
    router.get('/:tenantId', async (req, res) => {
        return res.json(await service.list(req.params.tenantId));
    });
    router.get('/:tenantId/reusable', async (req, res) => {
        return res.json(await service.reusable(req.params.tenantId));
    });
    // Sprint 8: Pattern Detection — clusters reusable Learnings into recurring
    // terms, not just individually captured patterns.
    router.get('/:tenantId/patterns', async (req, res) => {
        const reusable = await service.reusable(req.params.tenantId);
        const detector = new PatternDetectionService();
        const minOccurrences = req.query.min ? Number(req.query.min) : 2;
        return res.json({ patterns: detector.detect(reusable, minOccurrences) });
    });
    /**
     * Capability Gap Suggestions (Self-Evolving Intelligence sprint — the
     * one safe piece). GET only — this endpoint cannot create anything, by
     * construction. A human who agrees with a suggestion still has to go
     * create the Capability themselves through the existing, separate
     * Capability API.
     */
    router.get('/:tenantId/capability-gap-suggestions', async (req, res) => {
        const tenantId = req.params.tenantId;
        const [reusable, existingCapabilities] = await Promise.all([
            service.reusable(tenantId),
            new CapabilityRepository().list(tenantId),
        ]);
        const detector = new PatternDetectionService();
        const patterns = detector.detect(reusable);
        const suggestions = suggestCapabilityGaps(patterns, existingCapabilities.map((c) => c.name));
        return res.json({ suggestions, note: 'Suggestions only — nothing is created automatically. Review and create manually via the Capability API if appropriate.' });
    });
    return router;
}
export default learningRoutes;
