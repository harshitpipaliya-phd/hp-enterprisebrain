import { Router } from 'express';
import { z } from 'zod';
import { SearchRepository, SEARCHABLE_ENTITIES } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const querySchema = z.object({
    q: z.string().min(1),
    types: z.string().optional(), // comma-separated entity types
});
const defaultRepo = new SearchRepository();
export function searchRoutes(repo = defaultRepo) {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.get('/:tenantId', async (req, res) => {
        const parsed = querySchema.safeParse(req.query);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
        const types = parsed.data.types
            ? parsed.data.types.split(',').filter((t) => SEARCHABLE_ENTITIES.includes(t))
            : undefined;
        const results = await repo.search(req.params.tenantId, parsed.data.q, types);
        return res.json({ query: parsed.data.q, count: results.length, results });
    });
    return router;
}
export default searchRoutes;
