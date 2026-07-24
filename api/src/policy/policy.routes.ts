import { Router, type Response } from 'express';
import { z } from 'zod';
import { PolicyService } from './policy.service.js';
import { PolicyRepository, POLICY_TYPES } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'in']),
  value: z.unknown(),
});

const ruleSchema = z.object({
  field: z.string().min(1).optional(),
  operator: z.enum(['eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'in']).optional(),
  value: z.unknown().optional(),
  conditions: z.array(conditionSchema).optional(),
  match: z.enum(['all', 'any']).optional(),
  action: z.string().min(1),
}).refine((r) => (r.conditions && r.conditions.length > 0) || (r.field && r.operator), {
  message: 'A rule needs either field+operator (flat form) or conditions[] (composite form)',
});

const createSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  scope: z.string().min(1),
  policyType: z.enum(POLICY_TYPES),
  allowedExecutorClasses: z.array(z.unknown()).optional(),
  trustLevels: z.array(z.unknown()).optional(),
  routingCriteria: z.record(z.unknown()).optional(),
  escalationPath: z.array(z.unknown()).optional(),
  rules: z.array(ruleSchema).optional(),
});

const versionSchema = z.object({ rules: z.array(ruleSchema) });
const evaluateSchema = z.object({ context: z.record(z.unknown()) });

const defaultRepo = new PolicyRepository();

export function policyRoutes(service = new PolicyService(defaultRepo)): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const policy = await service.create({ ...parsed.data, rules: parsed.data.rules as any, createdBy: req.user!.id });
    return res.status(201).json(policy);
  });

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await service.list(req.params.tenantId, req.query.policyType as any));
  });

  router.get('/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const policy = await service.get(req.params.tenantId, req.params.id);
    if (!policy) return res.status(404).json({ error: 'not_found' });
    return res.json(policy);
  });

  router.get('/:tenantId/:id/history', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await service.history(req.params.tenantId, req.params.id));
  });

  router.post('/:tenantId/:id/version', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = versionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    try {
      const policy = await service.createVersion(req.params.tenantId, req.params.id, parsed.data.rules as any, req.user!.id);
      return res.status(201).json(policy);
    } catch (e: any) {
      if (e.message === 'policy_not_found') return res.status(404).json({ error: 'not_found' });
      throw e;
    }
  });

  router.post('/:tenantId/:id/evaluate', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = evaluateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const policy = await service.get(req.params.tenantId, req.params.id);
    if (!policy) return res.status(404).json({ error: 'not_found' });
    return res.json(service.evaluate(policy, parsed.data.context));
  });

  return router;
}

export default policyRoutes;
