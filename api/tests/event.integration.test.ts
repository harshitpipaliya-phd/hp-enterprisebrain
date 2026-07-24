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

test('API integration: events endpoints return 401 without auth', async () => {
  const app = createApp();
  await new Promise<void>((resolveTest, rejectTest) => {
    const server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === 'string') { resolveTest(); return; }
      const port = address.port;
      try {
        await waitForPort(port);
        const res = await new Promise<number>((resolve, reject) => {
          http.get(`http://localhost:${port}/api/v1/events`, (res) => {
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

test('API integration: events stats endpoint requires auth', async () => {
  const app = createApp();
  await new Promise<void>((resolveTest, rejectTest) => {
    const server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === 'string') { resolveTest(); return; }
      const port = address.port;
      try {
        await waitForPort(port);
        const res = await new Promise<number>((resolve, reject) => {
          http.get(`http://localhost:${port}/api/v1/events/stats/summary`, (res) => {
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
