import { Router, type Response } from 'express';
import { MentalModelService } from './mental-model.service.js';
import { MentalModelRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const defaultRepo = new MentalModelRepository();

export function mentalModelRoutes(service = new MentalModelService(defaultRepo)): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await service.list(req.params.tenantId));
  });

  router.get('/:tenantId/domain/:domain', async (req: AuthenticatedRequest, res: Response) => {
    const model = await service.forDomain(req.params.tenantId, req.params.domain);
    if (!model) return res.status(404).json({ error: 'not_found' });
    return res.json(model);
  });

  router.get('/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const model = await service.get(req.params.tenantId, req.params.id);
    if (!model) return res.status(404).json({ error: 'not_found' });
    return res.json(model);
  });

  return router;
}

export default mentalModelRoutes;
