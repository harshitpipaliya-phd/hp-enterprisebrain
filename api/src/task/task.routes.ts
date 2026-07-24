import { Router, type Response } from 'express';
import { z } from 'zod';
import { TaskOrchestrator } from './task.orchestrator.js';
import { buildDefaultRegistry } from './builtin-tasks.js';
import { EsoRuntimeService } from '../eso/eso-runtime.service.js';
import { EsoExecutionRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const runSchema = z.object({
  tenantId: z.string().min(1),
  steps: z.array(z.object({
    taskName: z.string().min(1),
    input: z.record(z.unknown()).optional(),
    maxRetries: z.number().int().min(0).max(5).optional(),
  })).min(1),
  stopOnFailure: z.boolean().optional(),
});

const registry = buildDefaultRegistry();
const runtime = new EsoRuntimeService(new EsoExecutionRepository());
const orchestrator = new TaskOrchestrator(registry, runtime);

export function taskRoutes(): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.get('/registry', async (_req: AuthenticatedRequest, res: Response) => {
    return res.json(registry.list().map((t) => ({ name: t.name, description: t.description, category: t.category })));
  });

  router.post('/run', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const result = await orchestrator.runSequence(parsed.data.tenantId, req.user!.id, parsed.data.steps, parsed.data.stopOnFailure ?? true);
    return res.status(result.allSucceeded ? 200 : 207).json(result);
  });

  return router;
}

export default taskRoutes;
