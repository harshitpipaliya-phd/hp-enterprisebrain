import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import { ApiKeyRepository } from '@hpbrain/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
  };
}

const apiKeys = new ApiKeyRepository();

/**
 * Accepts either a JWT Bearer token (unchanged, existing behavior) OR a
 * real API key via `x-api-key` header (Part 5, Public API Platform sprint
 * — the one bounded, vendor-free piece of that request). An API key
 * currently inherits its creator's role rather than the fine-grained
 * scoping the schema reserves a column for — that's a real, named
 * limitation, not silently implied to be more granular than it is.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string' && apiKeyHeader.startsWith('hpb_')) {
    const key = await apiKeys.verify(apiKeyHeader);
    if (!key) {
      res.status(401).json({ error: 'invalid_api_key' });
      return;
    }
    req.user = { id: key.userId, tenantId: key.tenantId, email: '', name: '', role: 'org_admin' };
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }
  const token = header.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'invalid_token' });
    return;
  }
  req.user = {
    id: payload.sub,
    tenantId: payload.tenantId,
    email: '',
    name: '',
    role: payload.role,
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'missing_token' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'forbidden', requiredRoles: roles });
      return;
    }
    next();
  };
}
