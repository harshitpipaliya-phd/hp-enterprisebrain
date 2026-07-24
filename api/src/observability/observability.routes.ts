import { Router, type Request, type Response } from 'express';
import { ObservabilityService } from '../observability/observability.service.js';
import { HealthService } from '../health/health.service.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

export function observabilityRoutes(): Router {
  const router = Router();
  const observability = new ObservabilityService();
  const health = new HealthService();

  /**
   * Liveness and Readiness (Backend Completion Program, Milestone 10).
   * Deliberately UNAUTHENTICATED and registered before the auth gate below
   * — a Kubernetes probe, load balancer, or uptime monitor has no
   * credentials and cannot use the existing /health endpoints, which
   * require admin/tenant_admin auth. This was a real gap: "health
   * endpoints exist" was true, but not usable for their actual purpose.
   *
   * Liveness deliberately checks NOTHING beyond "the process can respond"
   * — a database outage should not make an orchestrator kill and restart
   * this process, since restarting doesn't fix the database. Readiness
   * DOES check real dependencies, since a broken DB/Neo4j connection means
   * this instance genuinely should not receive traffic.
   */
  router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
  });

  router.get('/ready', async (_req: Request, res: Response) => {
    const [db, neo4j] = await Promise.all([health.checkDatabase(), health.checkNeo4j()]);
    const ready = db.status === 'healthy' && neo4j.status === 'healthy';
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', database: db.status, neo4j: neo4j.status });
  });

  router.use(authMiddleware, requireRole('admin', 'tenant_admin'));

  router.get('/metrics/system', (_req: AuthenticatedRequest, res: Response) => {
    return res.json(observability.getSystemMetrics());
  });

  router.get('/metrics/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const { metricName, limit = '100' } = req.query;
    const metrics = await observability.getMetrics(req.params.tenantId, metricName as string | undefined);
    return res.json(metrics);
  });

  router.get('/metrics/:tenantId/:metricName/aggregates', async (req: AuthenticatedRequest, res: Response) => {
    const aggregates = await observability.getMetricAggregates(req.params.tenantId, req.params.metricName);
    return res.json(aggregates);
  });

  router.get('/health', async (_req: AuthenticatedRequest, res: Response) => {
    const status = await health.getHealthStatus();
    const httpStatus = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 503 : 500;
    res.status(httpStatus).json(status);
  });

  router.get('/health/database', async (_req: AuthenticatedRequest, res: Response) => {
    const result = await health.checkDatabase();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  });

  router.get('/health/neo4j', async (_req: AuthenticatedRequest, res: Response) => {
    const result = await health.checkNeo4j();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  });

  router.get('/health/events', async (_req: AuthenticatedRequest, res: Response) => {
    const result = await health.checkEvents();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  });

  router.get('/health/system', async (_req: AuthenticatedRequest, res: Response) => {
    const result = await health.checkSystem();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  });

  return router;
}

export default observabilityRoutes;
