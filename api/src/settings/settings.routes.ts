import { Router, type Response } from 'express';
import { z } from 'zod';
import { SettingsRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const setSchema = z.object({ key: z.string().min(1), value: z.unknown(), scope: z.enum(['org', 'personal']).default('personal') });

const repo = new SettingsRepository();

export function settingsRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.get('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const scope = req.query.scope === 'org' ? undefined : req.user!.id;
    return res.json(await repo.listForScope(req.params.tenantId, scope));
  });

  router.put('/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = setSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const scope = parsed.data.scope === 'org' ? undefined : req.user!.id;
    const setting = await repo.set(req.params.tenantId, parsed.data.key, parsed.data.value, scope);
    return res.json(setting);
  });

  /**
   * Network participation consent (Global Enterprise Intelligence Network
   * sprint, Part 5 — the one genuinely separable piece). Records a
   * tenant's opt-in/opt-out preference for future cross-organization
   * benchmarking. Deliberately does NOT read across tenants, does NOT
   * aggregate anything, and is NOT consumed by any benchmarking pipeline —
   * because that pipeline is the actual architectural decision (how
   * anonymization works, what a safe minimum cohort size is, how trust
   * policies are enforced) that hasn't been made. This just gives a real
   * place for that decision to be recorded once it is made, using the
   * existing tenant-scoped settings store — no new schema.
   */
  router.put('/:tenantId/network-consent', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = z.object({ optedIn: z.boolean(), categories: z.array(z.string()).optional() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const setting = await repo.set(req.params.tenantId, 'network_participation_consent', { optedIn: parsed.data.optedIn, categories: parsed.data.categories ?? [], recordedBy: req.user!.id, recordedDate: new Date().toISOString() });
    return res.json(setting);
  });

  return router;
}

export default settingsRoutes;
