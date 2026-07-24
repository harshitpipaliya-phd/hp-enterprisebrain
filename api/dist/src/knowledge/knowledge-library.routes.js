import { Router } from 'express';
import { z } from 'zod';
import { KnowledgeAssetRepository, KNOWLEDGE_CATEGORIES } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createSchema = z.object({
    tenantId: z.string().min(1),
    title: z.string().min(1),
    category: z.enum(KNOWLEDGE_CATEGORIES),
    content: z.string().min(1),
    tags: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    departmentId: z.string().optional(),
    relatedPersonIds: z.array(z.string()).optional(),
    relatedCapabilityIds: z.array(z.string()).optional(),
});
const repo = new KnowledgeAssetRepository();
export function knowledgeLibraryRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const asset = await repo.create({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(asset);
    });
    // Literal-path routes registered before the /:tenantId/:id catch-all, to
    // avoid the exact route-ordering bug caught earlier this engagement.
    router.get('/:tenantId/search', async (req, res) => {
        const q = req.query.q;
        if (typeof q !== 'string' || !q.trim())
            return res.status(400).json({ error: 'q_required' });
        return res.json(await repo.search(req.params.tenantId, q));
    });
    router.get('/:tenantId/most-reused', async (req, res) => {
        return res.json(await repo.mostReused(req.params.tenantId));
    });
    router.get('/:tenantId', async (req, res) => {
        const category = req.query.category;
        const departmentId = req.query.departmentId;
        return res.json(await repo.list(req.params.tenantId, category, departmentId));
    });
    router.get('/:tenantId/:id', async (req, res) => {
        const asset = await repo.findById(req.params.tenantId, req.params.id);
        if (!asset)
            return res.status(404).json({ error: 'not_found' });
        return res.json(asset);
    });
    router.post('/:tenantId/:id/reuse', async (req, res) => {
        const asset = await repo.markReused(req.params.tenantId, req.params.id);
        if (!asset)
            return res.status(404).json({ error: 'not_found' });
        return res.json(asset);
    });
    return router;
}
export default knowledgeLibraryRoutes;
