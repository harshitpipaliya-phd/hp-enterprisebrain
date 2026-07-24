import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tracingMiddleware } from '../src/middleware/tracing.middleware.js';
test('tracingMiddleware adds requestId and correlationId', async () => {
    let captured = null;
    const req = { headers: {} };
    const res = { setHeader: (k, v) => { captured = { ...captured, [k]: v }; } };
    const next = () => { };
    tracingMiddleware(req, res, next);
    assert.ok(req.tracing.requestId);
    assert.ok(req.tracing.correlationId);
    assert.ok(res._headers?.['x-request-id'] || captured?.['x-request-id']);
    assert.ok(res._headers?.['x-correlation-id'] || captured?.['x-correlation-id']);
});
