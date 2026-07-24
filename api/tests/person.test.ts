import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PersonService } from '../src/person/person.service.js';
import type { Person, CreatePersonInput, UpdatePersonInput } from '@hpbrain/database';

function createMockRepo() {
  const store: Record<string, Person> = {};
  const byEmployeeId: Record<string, string> = {};
  const byEmail: Record<string, string> = {};
  let nextId = 1;

  return {
    create: async (input: CreatePersonInput): Promise<Person> => {
      if (byEmployeeId[input.employeeId]) throw new Error(`Person with employeeId ${input.employeeId} already exists`);
      if (byEmail[input.email]) throw new Error(`Person with email ${input.email} already exists`);
      const id = `person-${nextId++}`;
      const now = new Date().toISOString();
      const person: Person = {
        id,
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: input.displayName ?? null,
        email: input.email,
        phone: input.phone ?? null,
        profilePhoto: input.profilePhoto ?? null,
        gender: input.gender ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        employmentType: input.employmentType ?? 'full_time',
        employmentStatus: input.employmentStatus ?? 'active',
        joiningDate: input.joiningDate ?? null,
        departmentId: input.departmentId ?? null,
        managerId: input.managerId ?? null,
        designation: input.designation ?? null,
        location: input.location ?? null,
        reportingManagerId: input.reportingManagerId ?? null,
        orgId: input.orgId,
        status: 'active',
        createdBy: input.createdBy,
        createdDate: now,
        updatedDate: now,
      };
      store[id] = person;
      byEmployeeId[input.employeeId] = id;
      byEmail[input.email] = id;
      return person;
    },
    findById: async (_tenantId: string, id: string): Promise<Person | null> => store[id] ?? null,
    findByEmployeeId: async (_tenantId: string, employeeId: string): Promise<Person | null> => {
      const id = byEmployeeId[employeeId];
      return id ? store[id] : null;
    },
    findByEmail: async (_tenantId: string, email: string): Promise<Person | null> => {
      const id = byEmail[email];
      return id ? store[id] : null;
    },
    list: async (tenantId: string): Promise<Person[]> => Object.values(store).filter((p) => p.tenantId === tenantId),
    search: async (tenantId: string, _query: string): Promise<Person[]> => Object.values(store).filter((p) => p.tenantId === tenantId),
    update: async (_tenantId: string, id: string, patch: UpdatePersonInput): Promise<Person | null> => {
      const existing = store[id];
      if (!existing) return null;
      const updated = { ...existing, ...patch, updatedDate: new Date().toISOString() } as Person;
      store[id] = updated;
      return updated;
    },
    archive: async (_tenantId: string, id: string): Promise<Person | null> => {
      const existing = store[id];
      if (!existing) return null;
      const archived = { ...existing, status: 'archived', updatedDate: new Date().toISOString() } as Person;
      store[id] = archived;
      return archived;
    },
  };
}

test('PersonService.create returns person with all fields', async () => {
  const s = new PersonService(createMockRepo() as any);
  const person = await s.create({ tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', orgId: 'o1', createdBy: 'u1' });
  assert.equal(person.tenantId, 't1');
  assert.equal(person.employeeId, 'E001');
  assert.equal(person.email, 'john@example.com');
  assert.equal(person.status, 'active');
  assert.ok(person.id);
  assert.ok(person.createdDate);
});

test('PersonService.create rejects duplicate employeeId', async () => {
  const repo = createMockRepo();
  const s = new PersonService(repo as any);
  await repo.create({ tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', orgId: 'o1', createdBy: 'u1' });
  await assert.rejects(() => s.create({ tenantId: 't1', employeeId: 'E001', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', orgId: 'o1', createdBy: 'u1' }), /already exists/);
});

test('PersonService.get returns null when missing', async () => {
  const s = new PersonService(createMockRepo() as any);
  assert.equal(await s.get('t1', 'missing'), null);
});

test('PersonService.list returns people for tenant', async () => {
  const repo = createMockRepo();
  const s = new PersonService(repo as any);
  await repo.create({ tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', orgId: 'o1', createdBy: 'u1' });
  const list = await s.list('t1');
  assert.equal(list.length, 1);
});

test('PersonService.archive sets status to archived', async () => {
  const repo = createMockRepo();
  const s = new PersonService(repo as any);
  const created = await repo.create({ tenantId: 't1', employeeId: 'E001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', orgId: 'o1', createdBy: 'u1' });
  const archived = await s.archive('t1', created.id);
  assert.equal(archived?.status, 'archived');
});
