import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import timeout from 'connect-timeout';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';
import { logger } from './logger.js';
import tenantRoutes from './tenant/tenant.routes.js';
import authRoutes from './auth/auth.routes.js';
import orgRoutes from './org/org.routes.js';
import departmentRoutes from './department/department.routes.js';
import personRoutes from './person/person.routes.js';
import capabilityRoutes from './capability/capability.routes.js';
import signalRoutes from './signal/signal.routes.js';
import evidenceRoutes from './evidence/evidence.routes.js';
import reasoningRoutes from './reasoning/reasoning.routes.js';
import recommendationRoutes from './recommendation/recommendation.routes.js';
import decisionRoutes from './decision/decision.routes.js';
import outcomeRoutes from './outcome/outcome.routes.js';
import learningRoutes from './learning/learning.routes.js';
import executorRoutes from './executor/executor.routes.js';
import policyRoutes from './policy/policy.routes.js';
import riskRoutes from './risk/risk.routes.js';
import analyticsRoutes from './analytics/analytics.routes.js';
import mentalModelRoutes from './mental-model/mental-model.routes.js';
import caseRoutes from './case/case.routes.js';
import hypothesisRoutes from './case/hypothesis.routes.js';
import graphQueryRoutes from './graph-query/graph-query.routes.js';
import conversationRoutes from './conversation/conversation.routes.js';
import taskRoutes from './task/task.routes.js';
import notificationRoutes from './events/notification.routes.js';
import settingsRoutes from './settings/settings.routes.js';
import aiRoutes from './ai/ai.routes.js';
import reasoningEngineRoutes from './reasoning-engine/reasoning-engine.routes.js';
import knowledgeLibraryRoutes from './knowledge/knowledge-library.routes.js';
import kasbaRoutes from './kasba/kasba.routes.js';
import careerRoutes from './career/career.routes.js';
import accreditationRoutes from './accreditation/accreditation.routes.js';
import placementRoutes from './placement/placement.routes.js';
import apiKeyRoutes from './auth/api-key.routes.js';
import guardianRoutes from './guardian/guardian.routes.js';
import esoRuntimeRoutes from './eso/eso-runtime.routes.js';
import workspaceRoutes from './workspace/workspace.routes.js';
import { eventRoutes } from './events/event.routes.js';
import { auditRoutes } from './audit/audit.routes.js';
import { observabilityRoutes } from './observability/observability.routes.js';
import { HealthService } from './health/health.service.js';
import { tracingMiddleware } from './middleware/tracing.middleware.js';
import { TenantService } from './tenant/tenant.service.js';
import { config } from './config.js';

/**
 * Foundation API application (Sprint 1, Story 1–9).
 */
export function createApp(): Express {
  const app = express();

  // CORS must be registered before every other middleware and route. The `cors`
  // package intercepts and fully answers OPTIONS preflight requests itself (it
  // never calls next() for OPTIONS), so this has to sit ahead of authMiddleware —
  // otherwise a browser's preflight (which never carries an Authorization header)
  // falls through to authMiddleware and gets rejected with 401, which is exactly
  // what was happening before this fix.
  const allowedOrigins = config.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // Security headers (audit finding: no helmet). Sets sensible defaults
  // (X-Content-Type-Options, X-Frame-Options, etc.) without configuration —
  // CSP is left at helmet's default rather than hand-tuned here, since a wrong
  // CSP silently breaks the frontend in ways that are hard to diagnose remotely.
  app.use(helmet());

  // Rate limiting (audit finding: none existed). Applied globally, not just to
  // auth routes — the autonomous-decision and analytics endpoints do real
  // database work per request and are equally worth protecting from abuse.
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // generous for legitimate API use; tune down per-tenant if abuse is observed
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Structured request logging (audit finding: 6 raw console.* calls, no log
  // levels). Auto-generates a request ID and logs method/path/status/duration
  // for every request — the operational visibility that was missing.
  app.use(pinoHttp({ logger }));

  // Request timeout (previously named gap: a request touching an unreachable
  // database hung forever instead of failing). connect-timeout marks req.timedout
  // after 15s and emits a 'timeout' event; this listener is what turns that into
  // an actual 503 response instead of the client waiting indefinitely.
  app.use(timeout('15s'));
  app.use((req, res, next) => {
    req.on('timeout', () => {
      if (!res.headersSent) {
        res.status(503).json({ error: 'request_timeout', message: 'The request took too long to process.' });
      }
    });
    next();
  });

  app.use(express.json());
  app.use(tracingMiddleware);

  /**
   * Root-level health endpoints (Backend Completion Program, Milestone 10).
   * The previous /health here was a Sprint-1 stub that always returned
   * {status: 'ok'} regardless of real system state — actively misleading
   * for production monitoring, not just incomplete. Real checks now, at
   * the root paths a Kubernetes probe or load balancer actually expects
   * (not nested under /api/v1/observability, which requires admin auth).
   */app.get('/', (_req, res) => {
  res.json({
    application: 'HP Enterprise Brain',
    status: 'Running',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health'
  });
});

  app.get('/live', (_req, res) => res.status(200).json({ status: 'alive' }));
  app.get('/ready', async (_req, res) => {
    const healthService = new HealthService();
    const [db, neo4j] = await Promise.all([healthService.checkDatabase(), healthService.checkNeo4j()]);
    const ready = db.status === 'healthy' && neo4j.status === 'healthy';
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', database: db.status, neo4j: neo4j.status });
  });
  app.get('/health', async (_req, res) => {
    const healthService = new HealthService();
    const status = await healthService.getHealthStatus();
    const httpStatus = status.status === 'healthy' ? 200 : status.status === 'degraded' ? 503 : 500;
    res.status(httpStatus).json(status);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use('/api/v1/tenants', tenantRoutes(new TenantService()));
  app.use('/api/v1/auth', authRoutes());
  app.use('/api/v1/organizations', orgRoutes());
  app.use('/api/v1/departments', departmentRoutes());
  app.use('/api/v1/people', personRoutes());
  app.use('/api/v1/capabilities', capabilityRoutes());
  app.use('/api/v1/signals', signalRoutes());
  app.use('/api/v1/evidence', evidenceRoutes());
  app.use('/api/v1/reasoning', reasoningRoutes());
  app.use('/api/v1/recommendations', recommendationRoutes());
  app.use('/api/v1/decisions', decisionRoutes());
  app.use('/api/v1/outcomes', outcomeRoutes());
  app.use('/api/v1/learnings', learningRoutes());
  app.use('/api/v1/eso-executions', esoRuntimeRoutes());
  app.use('/api/v1/executors', executorRoutes());
  app.use('/api/v1/policies', policyRoutes());
  app.use('/api/v1/risks', riskRoutes());
  app.use('/api/v1/analytics', analyticsRoutes());
  app.use('/api/v1/mental-models', mentalModelRoutes());
  // /api/v1/search (Postgres, Sprint 7) removed as public API — zero real
  // consumers found in the "product completion" audit; /api/v1/graph/search
  // (Neo4j, Sprint 8) is a proper superset (17 labels vs 5) and is the one
  // real search feature the UI uses. The underlying SearchRepository stays,
  // used directly by the Task Orchestrator's search-knowledge task.
  app.use('/api/v1/cases', caseRoutes());
  app.use('/api/v1/hypotheses', hypothesisRoutes());
  app.use('/api/v1/graph', graphQueryRoutes());
  app.use('/api/v1/conversations', conversationRoutes());
  app.use('/api/v1/tasks', taskRoutes());
  app.use('/api/v1/notifications', notificationRoutes());
  app.use('/api/v1/settings', settingsRoutes());
  app.use('/api/v1/ai', aiRoutes());
  app.use('/api/v1/reasoning-engine', reasoningEngineRoutes());
  app.use('/api/v1/knowledge-library', knowledgeLibraryRoutes());
  app.use('/api/v1/kasba', kasbaRoutes());
  app.use('/api/v1/career', careerRoutes());
  app.use('/api/v1/accreditation', accreditationRoutes());
  app.use('/api/v1/placement', placementRoutes());
  app.use('/api/v1/api-keys', apiKeyRoutes());
  app.use('/api/v1/guardians', guardianRoutes());
  app.use('/api/v1/workspace', workspaceRoutes());
  app.use('/api/v1/events', eventRoutes());
  app.use('/api/v1/audit', auditRoutes());
  app.use('/api/v1/observability', observabilityRoutes());

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    logger.error({ err }, 'Unhandled request error');
    res.status(500).json({ error: 'internal_error', message: err.message });
  });

  return app;
}

export default createApp;
