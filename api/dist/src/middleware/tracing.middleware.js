import { randomUUID } from 'node:crypto';
export function tracingMiddleware(req, res, next) {
    const requestId = randomUUID();
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    req.tracing = {
        requestId,
        correlationId,
        startTime: Date.now(),
    };
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', correlationId);
    next();
}
