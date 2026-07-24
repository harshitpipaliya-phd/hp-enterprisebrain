import { Router } from 'express';
import { AuditRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
export function auditRoutes() {
    const router = Router();
    const auditRepo = new AuditRepository();
    router.use(authMiddleware, requireRole('admin', 'tenant_admin', 'auditor'));
    router.get('/', async (req, res) => {
        const { tenantId, entityType, entityId, action, correlationId, eventId, q, limit = '100' } = req.query;
        let logs;
        if (correlationId) {
            logs = await auditRepo.findByCorrelationId(correlationId);
        }
        else if (eventId) {
            logs = await auditRepo.findByEventId(eventId);
        }
        else if (entityType && entityId) {
            logs = await auditRepo.findByEntity(req.user?.tenantId ?? '', entityType, entityId);
        }
        else if (q) {
            logs = await auditRepo.search(req.user?.tenantId ?? '', q, Number(limit));
        }
        else if (tenantId) {
            logs = await auditRepo.findByTenant(tenantId, Number(limit));
        }
        else {
            logs = await auditRepo.findByTenant(req.user?.tenantId ?? '', Number(limit));
        }
        return res.json(logs);
    });
    router.get('/activity', async (req, res) => {
        const tenantId = req.user?.tenantId ?? '';
        const timeline = await auditRepo.getActivityTimeline(tenantId, 50);
        return res.json(timeline);
    });
    router.get('/stats', async (req, res) => {
        const tenantId = req.user?.tenantId ?? '';
        const [total, byAction] = await Promise.all([
            auditRepo.count(tenantId),
            auditRepo.countByAction(tenantId),
        ]);
        return res.json({ total, byAction });
    });
    router.get('/:id', async (req, res) => {
        const logs = await auditRepo.findByCorrelationId(req.params.id);
        if (!logs.length)
            return res.status(404).json({ error: 'not_found' });
        return res.json(logs[0]);
    });
    return router;
}
export default auditRoutes;
