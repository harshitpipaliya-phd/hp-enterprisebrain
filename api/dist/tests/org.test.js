import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationService } from '../src/org/org.service.js';
function createMockRepo() {
    const store = {};
    let nextId = 1;
    return {
        create: async (input) => {
            const id = `org-${nextId++}`;
            const now = new Date().toISOString();
            const org = {
                id,
                tenantId: input.tenantId,
                name: input.name,
                legalName: input.legalName ?? null,
                orgCode: input.orgCode,
                industry: input.industry ?? null,
                country: input.country ?? null,
                timezone: input.timezone ?? 'UTC',
                currency: input.currency ?? 'USD',
                logo: input.logo ?? null,
                status: 'active',
                createdBy: input.createdBy,
                createdDate: now,
                updatedDate: now,
            };
            store[id] = org;
            return org;
        },
        findById: async (_tenantId, id) => store[id] ?? null,
        list: async (tenantId) => Object.values(store).filter((o) => o.tenantId === tenantId),
        update: async (_tenantId, id, patch) => {
            const existing = store[id];
            if (!existing)
                return null;
            const updated = { ...existing, ...patch, updatedDate: new Date().toISOString() };
            store[id] = updated;
            return updated;
        },
        archive: async (_tenantId, id) => {
            const existing = store[id];
            if (!existing)
                return null;
            const archived = { ...existing, status: 'archived', updatedDate: new Date().toISOString() };
            store[id] = archived;
            return archived;
        },
    };
}
test('OrganizationService.create returns org with all fields', async () => {
    const s = new OrganizationService(createMockRepo());
    const org = await s.create({ tenantId: 't1', name: 'Acme', orgCode: 'ACM', createdBy: 'u1' });
    assert.equal(org.tenantId, 't1');
    assert.equal(org.name, 'Acme');
    assert.equal(org.orgCode, 'ACM');
    assert.equal(org.status, 'active');
    assert.equal(org.timezone, 'UTC');
    assert.equal(org.currency, 'USD');
    assert.ok(org.id);
    assert.ok(org.createdDate);
});
test('OrganizationService.get returns null when missing', async () => {
    const s = new OrganizationService(createMockRepo());
    assert.equal(await s.get('t1', 'missing'), null);
});
test('OrganizationService.list returns orgs for tenant', async () => {
    const repo = createMockRepo();
    const s = new OrganizationService(repo);
    await repo.create({ tenantId: 't1', name: 'A', orgCode: 'A1', createdBy: 'u1' });
    const list = await s.list('t1');
    assert.equal(list.length, 1);
});
test('OrganizationService.update patches fields', async () => {
    const repo = createMockRepo();
    const s = new OrganizationService(repo);
    const created = await repo.create({ tenantId: 't1', name: 'A', orgCode: 'A2', createdBy: 'u1' });
    const updated = await s.update('t1', created.id, { name: 'B' });
    assert.equal(updated?.name, 'B');
});
test('OrganizationService.archive sets status to archived', async () => {
    const repo = createMockRepo();
    const s = new OrganizationService(repo);
    const created = await repo.create({ tenantId: 't1', name: 'A', orgCode: 'A3', createdBy: 'u1' });
    const archived = await s.archive('t1', created.id);
    assert.equal(archived?.status, 'archived');
});
