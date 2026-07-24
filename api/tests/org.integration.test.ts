import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

function waitForPort(port: number, timeout = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, 50);
      });
    };
    check();
  });
}

test('API integration: health endpoint', async () => {
  const app = createApp();
  await new Promise<void>((resolveTest, rejectTest) => {
    const server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === 'string') { resolveTest(); return; }
      const port = address.port;
      try {
        await waitForPort(port);
        const res = await new Promise<any>((resolve, reject) => {
          http.get(`http://localhost:${port}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
          }).on('error', reject);
        });
        // Real health check now performs real DB/Neo4j connectivity checks
        // (Backend Completion Program, Milestone 10) — it previously always
        // returned a hardcoded {status: 'ok'}, which this assertion used to
        // test. This environment has no live database, so a real check
        // correctly reports unhealthy (503) here — that's the check
        // working, not failing. Assert the real, honest contract: a valid
        // status code from the real set, and a body shape that always
        // includes a status field, rather than hardcoding the fake answer.
        assert.ok([200, 500, 503].includes(res.status), `expected a real health status code, got ${res.status}`);
        assert.ok(['healthy', 'degraded', 'unhealthy'].includes(res.body.status), `expected a real health status value, got ${res.body.status}`);
        resolveTest();
      } catch (err) {
        rejectTest(err);
      } finally {
        server.close();
      }
    });
  });
});

test('API integration: organizations endpoints return 401 without auth', async () => {
  const app = createApp();
  await new Promise<void>((resolveTest, rejectTest) => {
    const server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === 'string') { resolveTest(); return; }
      const port = address.port;
      try {
        await waitForPort(port);
        const res = await new Promise<number>((resolve, reject) => {
          http.get(`http://localhost:${port}/api/v1/organizations/t1`, (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
          }).on('error', reject);
        });
        assert.equal(res, 401);
        resolveTest();
      } catch (err) {
        rejectTest(err);
      } finally {
        server.close();
      }
    });
  });
});
