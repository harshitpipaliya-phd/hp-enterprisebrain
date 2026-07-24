import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export interface TracingContext {
  requestId: string;
  correlationId: string;
  startTime: number;
}

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

  (req as any).tracing = {
    requestId,
    correlationId,
    startTime: Date.now(),
  };

  res.setHeader('x-request-id', requestId);
  res.setHeader('x-correlation-id', correlationId);

  next();
}
