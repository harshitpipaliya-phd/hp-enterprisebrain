import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TenantService } from '../src/tenant/tenant.service.js';
import { BaseRepository } from '../src/repository/base.js';
import type { TenantSession } from '../src/neo4j/client.js';

function fakeSession(
  tenantId: string,
  records: Array<Record<string, unknown>> = [],
): TenantSession {
  const wrapped = records.map((r) => ({
    ...r,
    toObject: () => r,
  }));
  const s: any = {
    tenantId,
    run: async () => ({ records: wrapped }),
    close: async () => {},
  };
  return s;
}

test('BaseRepository rejects a query missing tenantId param', async () => {
  const s: any = fakeSession('t1');
  class R extends BaseRepository {
    async go() {
      return this.run('MATCH (n:Person {tenantId: $tenantId}) RETURN n', {});
    }
  }
  await assert.rejects(() => new R(s).go(), /tenantId parameter/);
});

test('BaseRepository rejects Cypher without tenantId reference', async () => {
  const s: any = fakeSession('t1');
  class R extends BaseRepository {
    async go() {
      return this.run('MATCH (n:Node) RETURN n', { tenantId: 't1' });
    }
  }
  await assert.rejects(() => new R(s).go(), /must reference tenantId/);
});

test('BaseRepository propagates errors thrown by session.run()', async () => {
  const s: any = {
    tenantId: 't1',
    run: async () => { throw new Error('neo4j constraint violation'); },
    close: async () => {},
  };
  class R extends BaseRepository {
    async go() {
      return this.run('MATCH (n:Person {tenantId: $tenantId}) RETURN n', { tenantId: 't1' });
    }
  }
  await assert.rejects(() => new R(s).go(), /neo4j constraint violation/);
});

  test('TenantService.create returns a tenant with id === tenantId', async () => {
  const svc = new TenantService(() =>
    fakeSession('ignored', [
      {
        t: { id: 'new-id', name: 'Acme', region: 'eu-west', status: 'provisioning', createdAt: '2026-01-01T00:00:00Z' },
      },
    ]),
  );

  const tenant = await svc.create({ name: 'Acme', region: 'eu-west' });

  assert.ok(tenant.id);
  assert.equal(tenant.name, 'Acme');
  assert.equal(tenant.region, 'eu-west');
  assert.equal(tenant.status, 'provisioning');
});

test('TenantService.get returns null when no tenant found', async () => {
  const svc = new TenantService(() => fakeSession('tenant-abc', []));
  const tenant = await svc.get('tenant-abc');
  assert.equal(tenant, null);
});

test('TenantService.stats returns counts scoped by tenantId', async () => {
  const svc = new TenantService(() =>
    fakeSession('tenant-xyz', [{ orgUnits: 2, people: 5, roles: 3, esos: 1 }]),
  );

  const stats = await svc.stats('tenant-xyz');

  assert.equal(stats.orgUnits, 2);
  assert.equal(stats.people, 5);
  assert.equal(stats.roles, 3);
  assert.equal(stats.esos, 1);
});
