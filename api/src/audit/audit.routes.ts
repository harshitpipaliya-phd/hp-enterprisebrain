import { Router, type Request, type Response } from 'express';
import { AuditRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

export function auditRoutes(): Router {
  const router = Router();
  const auditRepo = new AuditRepository();

  router.use(authMiddleware, requireRole('admin', 'tenant_admin', 'auditor'));

  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId, entityType, entityId, action, correlationId, eventId, q, limit = '100' } = req.query;
    let logs;

    if (correlationId) {
      logs = await auditRepo.findByCorrelationId(correlationId as string);
    } else if (eventId) {
      logs = await auditRepo.findByEventId(eventId as string);
    } else if (entityType && entityId) {
      logs = await auditRepo.findByEntity((req as any).user?.tenantId ?? '', entityType as string, entityId as string);
    } else if (q) {
      logs = await auditRepo.search((req as any).user?.tenantId ?? '', q as string, Number(limit));
    } else if (tenantId) {
      logs = await auditRepo.findByTenant(tenantId as string, Number(limit));
    } else {
      logs = await auditRepo.findByTenant((req as any).user?.tenantId ?? '', Number(limit));
    }

    return res.json(logs);
  });

  router.get('/activity', async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? '';
    const timeline = await auditRepo.getActivityTimeline(tenantId, 50);
    return res.json(timeline);
  });

  router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? '';
    const [total, byAction] = await Promise.all([
      auditRepo.count(tenantId),
      auditRepo.countByAction(tenantId),
    ]);
    return res.json({ total, byAction });
  });

  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const logs = await auditRepo.findByCorrelationId(req.params.id);
    if (!logs.length) return res.status(404).json({ error: 'not_found' });
    return res.json(logs[0]);
  });

  return router;
}

export default auditRoutes;
