import { Router } from 'express';
import { NotificationRepository } from '@hpbrain/database';
import { authMiddleware, requireRole } from '../auth/auth.middleware.js';
const repo = new NotificationRepository();
export function notificationRoutes() {
    const router = Router();
    router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));
    router.get('/:tenantId', async (req, res) => {
        const unreadOnly = req.query.unread === 'true';
        return res.json(await repo.listForUser(req.params.tenantId, req.user.id, unreadOnly));
    });
    router.get('/:tenantId/unread-count', async (req, res) => {
        return res.json({ count: await repo.unreadCount(req.params.tenantId, req.user.id) });
    });
    router.patch('/:tenantId/:id/read', async (req, res) => {
        const notification = await repo.markRead(req.params.tenantId, req.user.id, req.params.id);
        if (!notification)
            return res.status(404).json({ error: 'not_found' });
        return res.json(notification);
    });
    router.post('/:tenantId/read-all', async (req, res) => {
        const count = await repo.markAllRead(req.params.tenantId, req.user.id);
        return res.json({ markedRead: count });
    });
    return router;
}
export default notificationRoutes;
