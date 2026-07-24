import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationGraphRepository } from '../src/org/org.graph.repository.js';
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

test('Neo4j: Organization create uses Organization label and tenantId', async () => {
  const session = fakeSession('t1');
  const repo = new OrganizationGraphRepository(session);
  await repo.create({ tenantId: 't1', name: 'Acme', orgCode: 'ACM', createdBy: 'u1' });
  const call = session.captured[0];
  assert.ok(call.cypher.includes('CREATE (o:Organization'), 'CREATE should use :Organization label');
  assert.ok(call.cypher.includes('tenantId: $tenantId'), 'CREATE must include tenantId');
  assert.equal(call.params.tenantId, 't1');
  assert.equal(call.params.orgCode, 'ACM');
  assert.equal(call.params.status, 'active');
});

test('Neo4j: Organization findById uses Organization label and tenantId', async () => {
  const session = fakeSession('t1');
  const repo = new OrganizationGraphRepository(session);
  await repo.findById('t1', 'o1');
  const call = session.captured[0];
  assert.ok(call.cypher.includes('MATCH (o:Organization'), 'findById should use :Organization label');
  assert.ok(call.cypher.includes('tenantId'), 'findById must reference tenantId');
  assert.equal(call.params.tenantId, 't1');
});

test('Neo4j: Organization list scopes by tenantId', async () => {
  const session = fakeSession('t1');
  const repo = new OrganizationGraphRepository(session);
  await repo.list('t1');
  const call = session.captured[0];
  assert.ok(call.cypher.includes('tenantId'), 'list must reference tenantId');
  assert.equal(call.params.tenantId, 't1');
});

test('Neo4j: Organization update uses Organization label and tenantId', async () => {
  const session = fakeSession('t1', [{ id: 'o1', tenantId: 't1', name: 'A', legalName: null, orgCode: 'A', industry: null, country: null, timezone: 'UTC', currency: 'USD', logo: null, status: 'active', createdBy: 'u1', createdDate: '1', updatedDate: '2' }]);
  const repo = new OrganizationGraphRepository(session);
  await repo.update('t1', 'o1', { name: 'New' });
  assert.ok(session.captured.length >= 1, 'should have at least one Cypher call');
  const lastCall = session.captured[session.captured.length - 1];
  assert.ok(lastCall.cypher.includes('MATCH (o:Organization'), 'update should use :Organization label');
  assert.ok(lastCall.cypher.includes('tenantId'), 'update must reference tenantId');
  assert.equal(lastCall.params.tenantId, 't1');
});

test('Neo4j: Organization archive sets status to archived', async () => {
  const session = fakeSession('t1', [{ id: 'o1', tenantId: 't1', name: 'A', legalName: null, orgCode: 'A', industry: null, country: null, timezone: 'UTC', currency: 'USD', logo: null, status: 'active', createdBy: 'u1', createdDate: '1', updatedDate: '2' }]);
  const repo = new OrganizationGraphRepository(session);
  await repo.archive('t1', 'o1');
  assert.ok(session.captured.length >= 1, 'should have at least one Cypher call');
  const lastCall = session.captured[session.captured.length - 1];
  assert.ok(lastCall.cypher.includes('status = $status'), 'archive must set status');
  assert.equal(lastCall.params.status, 'archived');
});
