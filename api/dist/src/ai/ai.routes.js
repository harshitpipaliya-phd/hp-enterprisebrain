import { Router } from 'express';
import { z } from 'zod';
import { getAIProvider, listAvailableProviders } from './provider.factory.js';
import { EvidenceSummarizerService } from './evidence-summarizer.service.js';
import { DecisionExplainerService } from './decision-explainer.service.js';
import { RecommendationImproverService } from './recommendation-improver.service.js';
import { AIExecutionRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const summarizeSchema = z.object({ content: z.string().min(1), entityId: z.string().optional() });
const explainDecisionSchema = z.object({
    rationale: z.string(), confidence: z.number(), executorType: z.string(), trace: z.array(z.unknown()).optional(), entityId: z.string().optional(),
});
const improveRecommendationSchema = z.object({
    title: z.string(), description: z.string().nullable(), category: z.string(), priority: z.string(), confidence: z.number(), entityId: z.string().optional(),
});
const executions = new AIExecutionRepository();
export function aiRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.get('/providers', async (_req, res) => {
        return res.json({ providers: listAvailableProviders(), active: process.env.AI_PROVIDER ?? 'anthropic (default, unconfigured)' });
    });
    router.get('/executions/:tenantId', async (req, res) => {
        return res.json(await executions.list(req.params.tenantId));
    });
    router.post('/evidence/summarize', async (req, res) => {
        const parsed = summarizeSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const service = new EvidenceSummarizerService(getAIProvider(), executions);
        const result = await service.summarize(req.user.tenantId, req.user.id, parsed.data.content, parsed.data.entityId);
        if ('error' in result)
            return res.status(result.providerConfigured ? 502 : 501).json(result);
        return res.json(result);
    });
    router.post('/decision/explain', async (req, res) => {
        const parsed = explainDecisionSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const service = new DecisionExplainerService(getAIProvider(), executions);
        const result = await service.explain(req.user.tenantId, req.user.id, { ...parsed.data, trace: parsed.data.trace ?? [] }, parsed.data.entityId);
        if ('error' in result)
            return res.status(result.providerConfigured ? 502 : 501).json(result);
        return res.json(result);
    });
    router.post('/recommendation/improve', async (req, res) => {
        const parsed = improveRecommendationSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const service = new RecommendationImproverService(getAIProvider(), executions);
        const result = await service.improve(req.user.tenantId, req.user.id, parsed.data, parsed.data.entityId);
        if ('error' in result)
            return res.status(result.providerConfigured ? 502 : 501).json(result);
        return res.json(result);
    });
    return router;
}
export default aiRoutes;
