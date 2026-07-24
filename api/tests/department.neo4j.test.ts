import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DepartmentGraphRepository } from '../src/department/department.graph.repository.js';
import type { TenantSession } from '../src/neo4j/client.js';

interface FakeSession extends TenantSession {
  captured: Array<{ cypher: string; params: Record<string, unknown> }>;
}

function fakeSession(tenantId: string, rows: Array<Record<string, unknown>> = []): FakeSession {
  const captured: Array<{ cypher: string; params: Record<string, unknown> }> = [];
  const wrapped = rows.map((r) => ({ ...r, toObject: () => r }));
  const s: any = {
    tenantId,
    captured,
    run: async (cypher: string, params: Record<string, unknown> = {}) => {
      captured.push({ cypher, params });
      if (!wrapped.length && params.id && params.tenantId) {
        return { records: [{ ...params, toObject: () => params }] };
      }
      return { records: wrapped };
    },
    close: async () => {},
  };
  return s;
}

test('Neo4j: Department create uses Department label and tenantId', async () => {
  const session = fakeSession('t1');
  const repo = new DepartmentGraphRepository(session);
  await repo.create({ tenantId: 't1', name: 'Engineering', orgId: 'o1', createdBy: 'u1' });
  const call = session.captured[0];
  assert.ok(call.cypher.includes('CREATE (d:Department'), 'CREATE should use :Department label');
  assert.ok(call.cypher.includes('tenantId: $tenantId'), 'CREATE must include tenantId');
  assert.equal(call.params.tenantId, 't1');
  assert.equal(call.params.orgId, 'o1');
});

test('Neo4j: Department findById uses Department label and tenantId', async () => {
  const session = fakeSession('t1');
  const repo = new DepartmentGraphRepository(session);
  await repo.findById('t1', 'd1');
  const call = session.captured[0];
  assert.ok(call.cypher.includes('MATCH (d:Department'), 'findById should use :Department label');
  assert.ok(call.cypher.includes('tenantId'), 'findById must reference tenantId');
  assert.equal(call.params.tenantId, 't1');
});

test('Neo4j: Department list scopes by tenantId', async () => {
  const session = fakeSession('t1');
  const repo = new DepartmentGraphRepository(session);
  await repo.list('t1');
  const call = session.captured[0];
  assert.ok(call.cypher.includes('tenantId'), 'list must reference tenantId');
  assert.equal(call.params.tenantId, 't1');
});

test('Neo4j: Department update uses Department label and tenantId', async () => {
  const session = fakeSession('t1', [{ id: 'd1', tenantId: 't1', name: 'A', description: null, departmentType: 'department', parentDepartmentId: null, headId: null, orgId: 'o1', status: 'active', createdBy: 'u1', createdDate: '1', updatedDate: '2' }]);
  const repo = new DepartmentGraphRepository(session);
  await repo.update('t1', 'd1', { name: 'New' });
  const call = session.captured[session.captured.length - 1];
  assert.ok(call.cypher.includes('MATCH (d:Department'), 'update should use :Department label');
  assert.ok(call.cypher.includes('tenantId'), 'update must reference tenantId');
  assert.equal(call.params.tenantId, 't1');
});

test('Neo4j: Department archive sets status to archived', async () => {
  const session = fakeSession('t1', [{ id: 'd1', tenantId: 't1', name: 'A', description: null, departmentType: 'department', parentDepartmentId: null, headId: null, orgId: 'o1', status: 'active', createdBy: 'u1', createdDate: '1', updatedDate: '2' }]);
  const repo = new DepartmentGraphRepository(session);
  await repo.archive('t1', 'd1');
  const call = session.captured[session.captured.length - 1];
  assert.ok(call.cypher.includes('status = $status'), 'archive must set status');
  assert.equal(call.params.status, 'archived');
});
