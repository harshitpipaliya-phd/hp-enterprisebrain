import { Router } from 'express';
import { z } from 'zod';
import { ApiKeyRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from './auth.middleware.js';
const createSchema = z.object({ name: z.string().min(1), expiresDate: z.string().datetime().optional() });
const repo = new ApiKeyRepository();
export function apiKeyRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const { apiKey, rawKey } = await repo.create(req.user.tenantId, req.user.id, parsed.data.name, parsed.data.expiresDate);
        return res.status(201).json({ ...apiKey, key: rawKey, warning: 'This is the only time the full key will be shown. Store it securely.' });
    });
    router.get('/', async (req, res) => {
        return res.json(await repo.listForUser(req.user.tenantId, req.user.id));
    });
    router.delete('/:id', async (req, res) => {
        const revoked = await repo.revoke(req.user.tenantId, req.user.id, req.params.id);
        if (!revoked)
            return res.status(404).json({ error: 'not_found' });
        return res.status(204).send();
    });
    return router;
}
export default apiKeyRoutes;
