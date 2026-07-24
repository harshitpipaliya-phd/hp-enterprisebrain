import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
function waitForPort(port, timeout = 2000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const req = http.get(`http://localhost:${port}/health`, (res) => {
                res.resume();
                resolve();
            });
            req.on('error', () => {
                if (Date.now() - start > timeout)
                    return reject(new Error('timeout'));
                setTimeout(check, 50);
            });
        };
        check();
    });
}
test('API integration: capabilities endpoints return 401 without auth', async () => {
    const app = createApp();
    await new Promise((resolveTest, rejectTest) => {
        const server = app.listen(0, async () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                resolveTest();
                return;
            }
            const port = address.port;
            try {
                await waitForPort(port);
                const res = await new Promise((resolve, reject) => {
                    http.get(`http://localhost:${port}/api/v1/capabilities/t1`, (res) => {
                        res.resume();
                        resolve(res.statusCode ?? 0);
                    }).on('error', reject);
                });
                assert.equal(res, 401);
                resolveTest();
            }
            catch (err) {
                rejectTest(err);
            }
            finally {
                server.close();
            }
        });
    });
});
test('API integration: capability create requires auth', async () => {
    const app = createApp();
    await new Promise((resolveTest, rejectTest) => {
        const server = app.listen(0, async () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                resolveTest();
                return;
            }
            const port = address.port;
            try {
                await waitForPort(port);
                const res = await new Promise((resolve, reject) => {
                    const req = http.request(`http://localhost:${port}/api/v1/capabilities`, { method: 'POST', headers: { 'content-type': 'application/json' } }, (res) => {
                        res.resume();
                        resolve(res.statusCode ?? 0);
                    });
                    req.write(JSON.stringify({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Leadership', createdBy: 'u1' }));
                    req.end();
                    req.on('error', reject);
                });
                assert.equal(res, 401);
                resolveTest();
            }
            catch (err) {
                rejectTest(err);
            }
            finally {
                server.close();
            }
        });
    });
});
