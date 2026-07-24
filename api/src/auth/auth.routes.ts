import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { createAccessToken, createRefreshToken } from './jwt.js';
import { authMiddleware, type AuthenticatedRequest } from './auth.middleware.js';

const registerSchema = z.object({
  tenantId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(200),
  role: z.string().optional(),
});

const loginSchema = z.object({
  tenantId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export function authRoutes(service = new AuthService()): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }
    try {
      const tokens = await service.register(parsed.data);
      return res.status(201).json(tokens);
    } catch (e: any) {
      if (e.message === 'email_already_exists') {
        return res.status(409).json({ error: 'email_already_exists' });
      }
      throw e;
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }
    try {
      const tokens = await service.login(parsed.data);
      return res.json(tokens);
    } catch (e: any) {
      if (e.message === 'invalid_credentials') {
        return res.status(401).json({ error: 'invalid_credentials' });
      }
      throw e;
    }
  });

  router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'refresh_token_required' });
    }
    const tokens = await service.refresh(refreshToken);
    if (!tokens) return res.status(401).json({ error: 'invalid_refresh_token' });
    return res.json(tokens);
  });

  const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });

  router.post('/change-password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    try {
      await service.changePassword(req.user!.tenantId, req.user!.id, parsed.data.currentPassword, parsed.data.newPassword);
      return res.status(204).send();
    } catch (e: any) {
      if (e.message === 'invalid_current_password') return res.status(401).json({ error: 'invalid_current_password' });
      if (e.message === 'user_not_found') return res.status(404).json({ error: 'user_not_found' });
      throw e;
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    router.post('/dev-token', (_req: Request, res: Response) => {
      const user = { id: 'dev-user-1', tenantId: 't1', role: 'admin' };
      return res.json({
        accessToken: createAccessToken(user),
        refreshToken: createRefreshToken(user),
      });
    });
  }

  return router;
}

export default authRoutes;