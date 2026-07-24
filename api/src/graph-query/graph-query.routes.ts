import { Router, type Response } from 'express';
import { z } from 'zod';
import { GraphQueryRepository } from './graph-query.repository.js';
import { sessionFor } from '../neo4j/client.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const searchQuerySchema = z.object({
  q: z.string().min(1),
  labels: z.string().optional(),
});

export function graphQueryRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.get('/:tenantId/entity/:label/:id', async (req: AuthenticatedRequest, res: Response) => {
    const repo = new GraphQueryRepository(sessionFor(req.params.tenantId));
    try {
      const entity = await repo.getEntity(req.params.label, req.params.id);
      if (!entity) return res.status(404).json({ error: 'not_found' });
      return res.json(entity);
    } catch (e: any) {
      if (e.message?.startsWith('unknown_label')) return res.status(400).json({ error: e.message });
      throw e;
    } finally {
      await repo.close();
    }
  });

  router.get('/:tenantId/entity/:label/:id/related', async (req: AuthenticatedRequest, res: Response) => {
    const repo = new GraphQueryRepository(sessionFor(req.params.tenantId));
    try {
      const related = await repo.getRelated(req.params.label, req.params.id);
      return res.json({ related });
    } catch (e: any) {
      if (e.message?.startsWith('unknown_label')) return res.status(400).json({ error: e.message });
      throw e;
    } finally {
      await repo.close();
    }
  });

  router.get('/:tenantId/search', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
    const repo = new GraphQueryRepository(sessionFor(req.params.tenantId));
    try {
      const labels = parsed.data.labels ? parsed.data.labels.split(',') : [];
      const results = await repo.searchEntities(parsed.data.q, labels);
      return res.json({ query: parsed.data.q, count: results.length, results });
    } catch (e: any) {
      if (e.message?.startsWith('unknown_label')) return res.status(400).json({ error: e.message });
      throw e;
    } finally {
      await repo.close();
    }
  });

  return router;
}

export default graphQueryRoutes;
