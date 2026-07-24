import { Router, type Request, type Response } from 'express';
import { EventStoreRepository } from '@hpbrain/database';
import { EventDispatcher, GraphSyncConsumer, AuditConsumer, NotificationConsumer, AIConsumer, MetricsConsumer } from '../events/index.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

export function eventRoutes(): Router {
  const router = Router();
  const eventStore = new EventStoreRepository();
  const dispatcher = new EventDispatcher(eventStore);

  // Register consumers
  dispatcher.register(new GraphSyncConsumer());
  dispatcher.register(new AuditConsumer());
  dispatcher.register(new NotificationConsumer());
  dispatcher.register(new AIConsumer());
  dispatcher.register(new MetricsConsumer());

  router.use(authMiddleware, requireRole('admin', 'tenant_admin'));

  // "What Changed?" (Digital Twin Sprint, Part 7) — organization-wide
  // activity feed, reusing findByTenant (already real, already
  // tenant-scoped correctly) rather than building a second change-tracking
  // mechanism. Filters to a real time window rather than an arbitrary
  // fixed count, so "what changed this week" actually means a week.
  router.get('/:tenantId/what-changed', async (req: AuthenticatedRequest, res: Response) => {
    const days = req.query.days ? Number(req.query.days) : 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = await eventStore.findByTenant(req.params.tenantId, 500);
    const inWindow = recent.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
    const byType: Record<string, number> = {};
    for (const e of inWindow) byType[e.type] = (byType[e.type] ?? 0) + 1;
    return res.json({ windowDays: days, totalChanges: inWindow.length, byType, events: inWindow.slice(0, 100) });
  });

  // Intelligence Timeline (Enterprise Intelligence Engine Sprint, Part 5) —
  // reuses the event store that already exists rather than building a
  // second history-tracking mechanism; every domain event already carries
  // entityType/entityId/createdAt.
  router.get('/:tenantId/entity/:entityType/:entityId/timeline', async (req: AuthenticatedRequest, res: Response) => {
    const events = await eventStore.findByEntity(req.params.tenantId, req.params.entityType, req.params.entityId);
    return res.json(events.map((e) => ({ type: e.type, actorId: e.actorId, createdAt: e.createdAt, payload: e.payload })));
  });

  // List events
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const { type, tenantId, status, limit = '100', entityType, entityId } = req.query;
    let events;

    if (entityType && entityId && tenantId) {
      events = await eventStore.findByEntity(tenantId as string, entityType as string, entityId as string);
    } else if (type) {
      events = await eventStore.findByType(type as string, Number(limit));
    } else if (tenantId) {
      events = await eventStore.findByTenant(tenantId as string, Number(limit));
    } else if (status) {
      // Custom query for status filtering
      const pool = (await import('@hpbrain/database')).EventStoreRepository ? null : null;
      events = await eventStore.findPending(Number(limit));
    } else {
      events = await eventStore.findPending(Number(limit));
    }

    return res.json(events);
  });

  // Event details
  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const event = await eventStore.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'not_found' });
    return res.json(event);
  });

  // Replay event
  router.post('/:id/replay', async (req: AuthenticatedRequest, res: Response) => {
    const event = await eventStore.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'not_found' });

    // Re-publish as a new event
    const replayed = await eventStore.append({
      type: event.type,
      tenantId: event.tenantId,
      entityType: event.entityType,
      entityId: event.entityId,
      actorId: req.user!.id,
      payload: event.payload,
      metadata: { ...event.metadata, replayedFrom: event.id, replayedBy: req.user!.id },
      correlationId: event.correlationId ?? crypto.randomUUID(),
      causationId: event.id,
      idempotencyKey: `replay-${event.id}-${Date.now()}`,
    });

    await dispatcher.dispatch(replayed);
    return res.json({ replayed: replayed.id, original: event.id });
  });

  // Retry failed events
  router.post('/retry/failed', async (_req: AuthenticatedRequest, res: Response) => {
    const processed = await dispatcher.processPending(100);
    return res.json({ processed });
  });

  // Dead Letter Queue
  router.get('/dlq', async (_req: AuthenticatedRequest, res: Response) => {
    const entries = await eventStore.getDeadLetterEntries(100);
    return res.json(entries);
  });

  router.post('/dlq/:id/retry', async (req: AuthenticatedRequest, res: Response) => {
    const entry = await eventStore.getDeadLetterEntries(1);
    const found = entry.find((e) => e.id === req.params.id);
    if (!found) return res.status(404).json({ error: 'not_found' });

    const event = await eventStore.findById(found.eventId);
    if (!event) return res.status(404).json({ error: 'event_not_found' });

    await eventStore.updateStatus(event.id, 'pending');
    await eventStore.removeDeadLetter(found.id);
    await dispatcher.dispatch(event);

    return res.json({ retried: found.id });
  });

  router.delete('/dlq/:id', async (req: AuthenticatedRequest, res: Response) => {
    await eventStore.removeDeadLetter(req.params.id);
    return res.status(204).end();
  });

  // Statistics
  router.get('/stats/summary', async (_req: AuthenticatedRequest, res: Response) => {
    const [total, pending, processing, completed, failed] = await Promise.all([
      eventStore.count(),
      eventStore.countByStatus('pending'),
      eventStore.countByStatus('processing'),
      eventStore.countByStatus('completed'),
      eventStore.countByStatus('failed'),
    ]);

    const dlq = await eventStore.getDeadLetterEntries(1);
    const consumers = dispatcher.getConsumers();
    const consumerStates = await eventStore.getAllConsumerStates();

    return res.json({
      total,
      pending,
      processing,
      completed,
      failed,
      deadLetterCount: dlq.length,
      consumers,
      consumerStates,
    });
  });

  // Consumers
  router.get('/consumers', async (_req: AuthenticatedRequest, res: Response) => {
    const consumers = dispatcher.getConsumers();
    const states = await eventStore.getAllConsumerStates();
    return res.json({ consumers, states });
  });

  return router;
}

export default eventRoutes;
