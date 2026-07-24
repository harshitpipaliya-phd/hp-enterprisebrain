import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { OrganizationService } from './org.service.js';
import { OrganizationRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';
import { eventBus, OrganizationEvents } from '@hpbrain/events';
import { getOrganizationAuditLogs } from '@hpbrain/events';
import type { OrganizationStatus } from './org.types.js';

const createSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).optional(),
  orgCode: z.string().min(1).max(50),
  industry: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  createdBy: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  legalName: z.string().max(200).optional().nullable(),
  orgCode: z.string().min(1).max(50).optional(),
  industry: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
  logo: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

function serializeChanges(before: Record<string, unknown>, after: Record<string, unknown>): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys({ ...before, ...after })) {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }
  return changes;
}

const defaultRepo = new OrganizationRepository();

export function orgRoutes(service = new OrganizationService(defaultRepo)): Router {
  const router = Router();

  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin'));

  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }
    const input = { ...parsed.data, createdBy: req.user!.id };
    const org = await service.create(input);
    await eventBus.publish({
      type: OrganizationEvents.Created,
      tenantId: org.tenantId,
      entityType: 'Organization',
      entityId: org.id,
      actorId: req.user!.id,
      payload: { actorName: req.user!.name ?? req.user!.id, organization: org },
    });
    return res.status(201).json(org);
  });

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const status = (req.query.status as string | undefined) as OrganizationStatus | undefined;
    const orgs = await service.list(req.params.tenantId, status);
    return res.json(orgs);
  });

  router.get('/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const org = await service.get(req.params.tenantId, req.params.id);
    if (!org) return res.status(404).json({ error: 'not_found' });
    return res.json(org);
  });

  router.get('/:tenantId/:id/audit', async (req: AuthenticatedRequest, res: Response) => {
    const logs = await getOrganizationAuditLogs(req.params.tenantId, req.params.id);
    return res.json(logs);
  });

  router.patch('/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }
    const existing = await service.get(req.params.tenantId, req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const updated = await service.update(req.params.tenantId, req.params.id, parsed.data);
    if (!updated) return res.status(404).json({ error: 'not_found' });
    const changes = serializeChanges(existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    await eventBus.publish({
      type: OrganizationEvents.Updated,
      tenantId: updated.tenantId,
      entityType: 'Organization',
      entityId: updated.id,
      actorId: req.user!.id,
      payload: { actorName: req.user!.name ?? req.user!.id, changes, organization: updated },
    });
    return res.json(updated);
  });

  router.post('/:tenantId/:id/archive', async (req: AuthenticatedRequest, res: Response) => {
    const existing = await service.get(req.params.tenantId, req.params.id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const archived = await service.archive(req.params.tenantId, req.params.id);
    if (!archived) return res.status(404).json({ error: 'not_found' });
    await eventBus.publish({
      type: OrganizationEvents.Archived,
      tenantId: archived.tenantId,
      entityType: 'Organization',
      entityId: archived.id,
      actorId: req.user!.id,
      payload: { actorName: req.user!.name ?? req.user!.id, organization: archived },
    });
    return res.json(archived);
  });

  return router;
}

export default orgRoutes;
