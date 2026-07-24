import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TenantService } from '../src/tenant/tenant.service.js';
import { BaseRepository } from '../src/repository/base.js';
/**
 * Tests use a fake Neo4j session so they run without a live database or network.
 * The fake asserts the SAME invariant the CI enforces: every query carries tenantId.
 */
function fakeSession(tenantId, onRun) {
    const s = {
        tenantId,
        run: async (cypher, params = {}) => {
            if (onRun)
                onRun(cypher, params);
            // Return a minimal result shaped like neo4j result.
            return { records: [] };
        },
        close: async () => { },
    };
    return s;
}
// Patch sessionFor to return our fake for the duration of a test.
const realSessionFor = (await import('../src/neo4j/client.js')).sessionFor;
test('BaseRepository rejects a query missing tenantId param', async () => {
    const s = fakeSession('t1');
    class R extends BaseRepository {
        async go() {
            return this.run('MATCH (n:Person {tenantId: $tenantId}) RETURN n', {});
        }
    }
    await assert.rejects(() => new R(s).go(), /tenantId parameter/);
});
test('BaseRepository rejects Cypher without tenantId reference', async () => {
    const s = fakeSession('t1');
    class R extends BaseRepository {
        async go() {
            return this.run('MATCH (n:Node) RETURN n', { tenantId: 't1' });
        }
    }
    await assert.rejects(() => new R(s).go(), /must reference tenantId/);
});
test('TenantService.create returns a tenant with id === tenantId', async () => {
    let captured = null;
    const mod = await import('../src/neo4j/client.js');
    mod.sessionFor = ((_t) => fakeSession('x', (_c, p) => { captured = p; }));
    const svc = new TenantService();
    const tenant = await svc.create({ name: 'Acme', region: 'eu-west' });
    assert.ok(tenant.id);
    assert.equal(tenant.id, captured.tenantId, 'tenantId must equal the new id');
    assert.equal(captured.name, 'Acme');
    assert.equal(tenant.status, 'provisioning');
});
test('TenantService.get calls findById with tenantId scoping', async () => {
    let captured = null;
    const mod = await import('../src/neo4j/client.js');
    mod.sessionFor = ((t) => fakeSession(t, (_c, p) => { captured = p; }));
    const svc = new TenantService();
    await svc.get('tenant-abc');
    assert.equal(captured.id, 'tenant-abc');
    assert.equal(captured.tenantId, 'tenant-abc');
});
test('TenantService.stats queries counts scoped by tenantId', async () => {
    let captured = null;
    const mod = await import('../src/neo4j/client.js');
    mod.sessionFor = ((t) => fakeSession(t, (_c, p) => { captured = p; }));
    const svc = new TenantService();
    await svc.stats('tenant-xyz');
    assert.equal(captured.tenantId, 'tenant-xyz');
});
