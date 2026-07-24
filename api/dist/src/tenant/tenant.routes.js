import { Router } from 'express';
import { z } from 'zod';
import { TenantService } from './tenant.service.js';
const createSchema = z.object({
    name: z.string().min(1).max(200),
    region: z.string().max(50).optional(),
});
export function tenantRoutes(service = new TenantService()) {
    const router = Router();
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        }
        const tenant = await service.create(parsed.data);
        return res.status(201).json(tenant);
    });
    router.get('/:tenantId', async (req, res) => {
        const tenant = await service.get(req.params.tenantId);
        if (!tenant)
            return res.status(404).json({ error: 'tenant_not_found' });
        return res.json(tenant);
    });
    router.post('/:tenantId/activate', async (req, res) => {
        await service.activate(req.params.tenantId);
        return res.status(200).json({ status: 'activated' });
    });
    router.get('/:tenantId/stats', async (req, res) => {
        const stats = await service.stats(req.params.tenantId);
        return res.json(stats);
    });
    return router;
}
export default tenantRoutes;
