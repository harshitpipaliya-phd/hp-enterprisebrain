import { Router, type Response } from 'express';
import { z } from 'zod';
import { ConversationRepository, PromptTemplateRepository } from '@hpbrain/database';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth/auth.middleware.js';

const createSessionSchema = z.object({
  tenantId: z.string().min(1),
  orgId: z.string().optional(),
  title: z.string().optional(),
  contextType: z.string().optional(),
  contextEntityId: z.string().optional(),
});

const appendMessageSchema = z.object({ content: z.string().min(1) });

const promptTemplateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  template: z.string().min(1),
  variables: z.array(z.string()).optional(),
});

const defaultConversationRepo = new ConversationRepository();
const defaultPromptRepo = new PromptTemplateRepository();

export function conversationRoutes(repo = defaultConversationRepo): Router {
  const router = Router();
  router.use(authMiddleware, requireRole('admin', 'org_admin', 'tenant_admin', 'signal_admin'));

  router.post('/sessions', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const session = await repo.createSession({ ...parsed.data, createdBy: req.user!.id });
    return res.status(201).json(session);
  });

  router.get('/sessions/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await repo.listSessions(req.params.tenantId, req.query.mine === 'true' ? req.user!.id : undefined));
  });

  // Must be registered before /sessions/:tenantId/:id — otherwise Express
  // matches "search" as an :id value and this route is never reached.
  router.get('/sessions/:tenantId/search', async (req: AuthenticatedRequest, res: Response) => {
    const q = req.query.q;
    if (typeof q !== 'string' || !q.trim()) return res.status(400).json({ error: 'q_required' });
    return res.json(await repo.searchSessions(req.params.tenantId, q));
  });

  router.get('/sessions/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const session = await repo.findSessionById(req.params.tenantId, req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });
    return res.json(session);
  });

  router.get('/sessions/:tenantId/:id/messages', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await repo.getMessages(req.params.tenantId, req.params.id));
  });

  // Appends the user's message only. There is deliberately no endpoint that
  // generates an assistant reply — that requires an LLM provider decision
  // this route does not make on your behalf.
  router.post('/sessions/:tenantId/:id/messages', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = appendMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const session = await repo.findSessionById(req.params.tenantId, req.params.id);
    if (!session) return res.status(404).json({ error: 'not_found' });
    const message = await repo.appendMessage({ tenantId: req.params.tenantId, sessionId: req.params.id, role: 'user', content: parsed.data.content });
    return res.status(201).json({
      message,
      note: 'No assistant reply was generated. The generation endpoint is not built — see Sprint9 report for the LLM provider decision this needs first.',
    });
  });

  // Conversation Management: pin, rename, delete, search.
  router.patch('/sessions/:tenantId/:id/pin', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = z.object({ pinned: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const session = await repo.setPinned(req.params.tenantId, req.params.id, parsed.data.pinned);
    if (!session) return res.status(404).json({ error: 'not_found' });
    return res.json(session);
  });

  router.patch('/sessions/:tenantId/:id/rename', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = z.object({ title: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const session = await repo.rename(req.params.tenantId, req.params.id, parsed.data.title);
    if (!session) return res.status(404).json({ error: 'not_found' });
    return res.json(session);
  });

  router.delete('/sessions/:tenantId/:id', async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await repo.softDelete(req.params.tenantId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'not_found' });
    return res.status(204).send();
  });

  router.post('/prompt-templates', async (req: AuthenticatedRequest, res: Response) => {
    const parsed = promptTemplateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    const template = await defaultPromptRepo.create({ ...parsed.data, createdBy: req.user!.id });
    return res.status(201).json(template);
  });

  router.get('/prompt-templates/:tenantId', async (req: AuthenticatedRequest, res: Response) => {
    return res.json(await defaultPromptRepo.list(req.params.tenantId));
  });

  return router;
}

export default conversationRoutes;
