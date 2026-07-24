import { Router } from 'express';
import { z } from 'zod';
import { ExecutorRepository, RecommendationRepository, EXECUTOR_TYPES } from '@hpbrain/database';
import { ExecutorResolverService } from './executor-resolver.service.js';
import { eventBus, ExecutorEvents } from '@hpbrain/events';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const registerSchema = z.object({
    tenantId: z.string().min(1),
    executorType: z.enum(EXECUTOR_TYPES),
    name: z.string().min(1),
    personId: z.string().optional(),
    capabilityTags: z.array(z.string()).optional(),
    trustLevel: z.number().min(0).max(1).optional(),
    maxConcurrent: z.number().int().min(1).optional(),
});
const matchSchema = z.object({
    recommendationId: z.string().min(1),
    requiredCapability: z.string().optional(),
});
const defaultRepo = new ExecutorRepository();
const defaultRecommendationRepo = new RecommendationRepository();
export function executorRoutes(repo = defaultRepo, resolver = new ExecutorResolverService(defaultRepo)) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const executor = await repo.register(parsed.data);
        await eventBus.publish({
            type: ExecutorEvents.Registered,
            tenantId: executor.tenantId,
            entityType: 'Executor',
            entityId: executor.id,
            actorId: req.user.id,
            payload: { executor },
        });
        return res.status(201).json(executor);
    });
    router.get('/:tenantId', async (req, res) => {
        return res.json(await repo.list(req.params.tenantId));
    });
    router.post('/:tenantId/match', async (req, res) => {
        const parsed = matchSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const recommendation = await defaultRecommendationRepo.findById(req.params.tenantId, parsed.data.recommendationId);
        if (!recommendation)
            return res.status(404).json({ error: 'recommendation_not_found' });
        const match = await resolver.matchExecutor(req.params.tenantId, recommendation, parsed.data.requiredCapability);
        return res.json(match);
    });
    return router;
}
export default executorRoutes;
