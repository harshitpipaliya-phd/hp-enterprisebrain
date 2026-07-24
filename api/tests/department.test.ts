import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DepartmentService } from '../src/department/department.service.js';
import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Department> = {};
  let nextId = 1;

  return {
    create: async (input: CreateDepartmentInput): Promise<Department> => {
      const id = `dept-${nextId++}`;
      const now = new Date().toISOString();
      const dept: Department = {
        id,
        tenantId: input.tenantId,
        name: input.name,
        description: input.description ?? null,
        departmentType: input.departmentType ?? 'department',
        parentDepartmentId: input.parentDepartmentId ?? null,
        headId: input.headId ?? null,
        orgId: input.orgId,
        status: 'active',
        createdBy: input.createdBy,
        createdDate: now,
        updatedDate: now,
      };
      store[id] = dept;
      return dept;
    },
    findById: async (_tenantId: string, id: string): Promise<Department | null> => store[id] ?? null,
    list: async (tenantId: string): Promise<Department[]> => Object.values(store).filter((d) => d.tenantId === tenantId),
    update: async (_tenantId: string, id: string, patch: UpdateDepartmentInput): Promise<Department | null> => {
      const existing = store[id];
      if (!existing) return null;
      const updated = { ...existing, ...patch, updatedDate: new Date().toISOString() } as Department;
      store[id] = updated;
      return updated;
    },
    archive: async (_tenantId: string, id: string): Promise<Department | null> => {
      const existing = store[id];
      if (!existing) return null;
      const archived = { ...existing, status: 'archived', updatedDate: new Date().toISOString() } as Department;
      store[id] = archived;
      return archived;
    },
  };
}

test('DepartmentService.create returns department with all fields', async () => {
  const s = new DepartmentService(createMockRepo() as any);
  const dept = await s.create({ tenantId: 't1', name: 'Engineering', orgId: 'o1', createdBy: 'u1' });
  assert.equal(dept.tenantId, 't1');
  assert.equal(dept.name, 'Engineering');
  assert.equal(dept.orgId, 'o1');
  assert.equal(dept.status, 'active');
  assert.equal(dept.departmentType, 'department');
  assert.ok(dept.id);
  assert.ok(dept.createdDate);
});

test('DepartmentService.get returns null when missing', async () => {
  const s = new DepartmentService(createMockRepo() as any);
  assert.equal(await s.get('t1', 'missing'), null);
});

test('DepartmentService.list returns departments for tenant', async () => {
  const repo = createMockRepo();
  const s = new DepartmentService(repo as any);
  await repo.create({ tenantId: 't1', name: 'Engineering', orgId: 'o1', createdBy: 'u1' });
  const list = await s.list('t1');
  assert.equal(list.length, 1);
});

test('DepartmentService.update patches fields', async () => {
  const repo = createMockRepo();
  const s = new DepartmentService(repo as any);
  const created = await repo.create({ tenantId: 't1', name: 'Engineering', orgId: 'o1', createdBy: 'u1' });
  const updated = await s.update('t1', created.id, { description: 'Builds stuff' });
  assert.equal(updated?.description, 'Builds stuff');
});

test('DepartmentService.archive sets status to archived', async () => {
  const repo = createMockRepo();
  const s = new DepartmentService(repo as any);
  const created = await repo.create({ tenantId: 't1', name: 'Engineering', orgId: 'o1', createdBy: 'u1' });
  const archived = await s.archive('t1', created.id);
  assert.equal(archived?.status, 'archived');
});
