import { Router } from 'express';
import { z } from 'zod';
import { GuardianRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const createSchema = z.object({
    tenantId: z.string().min(1), studentPersonId: z.string().min(1), firstName: z.string().min(1), lastName: z.string().min(1),
    relationship: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional(), isPrimaryContact: z.boolean().optional(),
});
const repo = new GuardianRepository();
export function guardianRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.post('/', async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
        const guardian = await repo.create({ ...parsed.data, createdBy: req.user.id });
        return res.status(201).json(guardian);
    });
    router.get('/:tenantId/student/:studentPersonId', async (req, res) => {
        return res.json(await repo.listForStudent(req.params.tenantId, req.params.studentPersonId));
    });
    router.delete('/:tenantId/:id', async (req, res) => {
        const removed = await repo.remove(req.params.tenantId, req.params.id);
        if (!removed)
            return res.status(404).json({ error: 'not_found' });
        return res.status(204).send();
    });
    return router;
}
export default guardianRoutes;
