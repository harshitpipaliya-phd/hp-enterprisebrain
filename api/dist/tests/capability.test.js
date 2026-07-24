import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CapabilityService } from '../src/capability/capability.service.js';
function createMockRepo() {
    const store = {};
    const byCode = {};
    const versions = [];
    const assignments = [];
    let nextId = 1;
    return {
        create: async (input) => {
            const id = `cap-${nextId++}`;
            const now = new Date().toISOString();
            const cap = {
                id,
                tenantId: input.tenantId,
                orgId: input.orgId,
                capabilityCode: input.capabilityCode,
                name: input.name,
                description: input.description ?? null,
                category: input.category ?? 'general',
                capabilityType: input.capabilityType ?? 'competency',
                difficulty: input.difficulty ?? 'intermediate',
                criticality: input.criticality ?? 'medium',
                version: 1,
                status: 'active',
                createdBy: input.createdBy,
                createdDate: now,
                updatedDate: now,
                knowledge: input.knowledge ?? null,
                ability: input.ability ?? null,
                skill: input.skill ?? null,
                behaviour: input.behaviour ?? null,
                attitude: input.attitude ?? null,
            };
            store[id] = cap;
            byCode[input.capabilityCode] = id;
            return cap;
        },
        findById: async (_tenantId, id) => store[id] ?? null,
        findByCode: async (_tenantId, code) => {
            const id = byCode[code];
            return id ? store[id] : null;
        },
        list: async (tenantId) => Object.values(store).filter((c) => c.tenantId === tenantId),
        search: async (tenantId, _q) => Object.values(store).filter((c) => c.tenantId === tenantId),
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
        snapshotVersion: async (cap, _createdBy) => {
            versions.push({ capabilityId: cap.id, version: cap.version, name: cap.name, createdDate: new Date().toISOString() });
        },
        getVersions: async (_tenantId, capabilityId) => versions.filter((v) => v.capabilityId === capabilityId),
        upsertAssignment: async (_tenantId, capabilityId, targetType, targetId, assignedBy) => {
            const a = {
                id: `assign-${assignments.length + 1}`, tenantId: 't1', capabilityId, targetType, targetId, assignedBy, assignedDate: new Date().toISOString(), status: 'active',
            };
            assignments.push(a);
            return a;
        },
        removeAssignment: async (_tenantId, capabilityId, targetType, targetId) => {
            const idx = assignments.findIndex((a) => a.capabilityId === capabilityId && a.targetType === targetType && a.targetId === targetId);
            if (idx >= 0)
                assignments[idx].status = 'inactive';
        },
        getAssignments: async (_tenantId, capabilityId) => assignments.filter((a) => a.capabilityId === capabilityId && a.status === 'active'),
    };
}
test('CapabilityService.create returns capability with KASBA null defaults', async () => {
    const s = new CapabilityService(createMockRepo());
    const cap = await s.create({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Leadership', createdBy: 'u1' });
    assert.equal(cap.tenantId, 't1');
    assert.equal(cap.capabilityCode, 'CAP1');
    assert.equal(cap.name, 'Leadership');
    assert.equal(cap.status, 'active');
    assert.equal(cap.version, 1);
    assert.ok(cap.id);
    assert.equal(cap.knowledge, null);
});
test('CapabilityService.create rejects duplicate capability code', async () => {
    const repo = createMockRepo();
    const s = new CapabilityService(repo);
    await repo.create({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Leadership', createdBy: 'u1' });
    await assert.rejects(() => s.create({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Other', createdBy: 'u1' }), /already exists/);
});
test('CapabilityService.archive sets status to archived', async () => {
    const repo = createMockRepo();
    const s = new CapabilityService(repo);
    const created = await repo.create({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Leadership', createdBy: 'u1' });
    const archived = await s.archive('t1', created.id);
    assert.equal(archived?.status, 'archived');
});
test('CapabilityService.assign creates assignment', async () => {
    const repo = createMockRepo();
    const s = new CapabilityService(repo);
    const created = await repo.create({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Leadership', createdBy: 'u1' });
    const a = await s.assign('t1', created.id, 'Person', 'p1', 'u1');
    assert.equal(a.targetType, 'Person');
    assert.equal(a.targetId, 'p1');
    assert.equal((await s.getAssignments('t1', created.id)).length, 1);
});
test('CapabilityService.createVersion snapshots version', async () => {
    const repo = createMockRepo();
    const s = new CapabilityService(repo);
    const created = await repo.create({ tenantId: 't1', orgId: 'o1', capabilityCode: 'CAP1', name: 'Leadership', createdBy: 'u1' });
    await s.createVersion('t1', created.id, 'u1');
    const versions = await s.getVersions('t1', created.id);
    assert.equal(versions.length, 1);
    assert.equal(versions[0].version, 1);
});
