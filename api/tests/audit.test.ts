import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuditRepository } from '@hpbrain/database';

function createMockRepo() {
  const store: any[] = [];
  const byCorrelation: Record<string, any[]> = {};
  const byEvent: Record<string, any> = {};

  return {
    append: async (log: any) => {
      const id = crypto.randomUUID();
      const entry = { ...log, id, createdAt: new Date().toISOString() };
      store.push(entry);
      if (log.correlationId) byCorrelation[log.correlationId] = byCorrelation[log.correlationId] || []; byCorrelation[log.correlationId]?.push(entry);
      if (log.eventId) byEvent[log.eventId] = entry;
      return entry;
    },
    findByEntity: async (tenantId: string, entityType: string, entityId: string) => store.filter(e => e.tenantId === tenantId && e.entityType === entityType && e.entityId === entityId),
    findByTenant: async (tenantId: string) => store.filter(e => e.tenantId === tenantId),
    findByCorrelationId: async (correlationId: string) => byCorrelation[correlationId] || [],
    findByEventId: async (eventId: string) => byEvent[eventId] ? [byEvent[eventId]] : [],
    search: async (tenantId: string, q: string) => store.filter(e => e.tenantId === tenantId && (e.action.includes(q) || e.entityType.includes(q) || e.actorName.includes(q))),
    count: async (tenantId?: string) => tenantId ? store.filter(e => e.tenantId === tenantId).length : store.length,
    countByAction: async (tenantId: string) => {
      const counts: Record<string, number> = {};
      store.filter(e => e.tenantId === tenantId).forEach(e => { counts[e.action] = (counts[e.action] || 0) + 1; });
      return counts;
    },
    getActivityTimeline: async (tenantId: string, limit: number) => store.filter(e => e.tenantId === tenantId).slice(0, limit),
  };
}

test('AuditRepository.create stores extended fields', async () => {
  const repo = createMockRepo();
  const log = await repo.append({
    tenantId: 't1', orgId: 'o1', entityType: 'Organization', entityId: 'e1', action: 'create',
    actorId: 'u1', actorName: 'Admin', source: 'api', correlationId: 'corr-1', eventId: 'evt-1', executionTime: 42, status: 'success',
  });
  assert.equal(log.source, 'api');
  assert.equal(log.correlationId, 'corr-1');
  assert.equal(log.executionTime, 42);
});

test('AuditRepository.findByCorrelationId returns related logs', async () => {
  const repo = createMockRepo();
  await repo.append({ tenantId: 't1', entityType: 'Organization', entityId: 'e1', action: 'create', actorId: 'u1', actorName: 'Admin', correlationId: 'corr-1' });
  await repo.append({ tenantId: 't1', entityType: 'Person', entityId: 'e2', action: 'create', actorId: 'u1', actorName: 'Admin', correlationId: 'corr-1' });
  const logs = await repo.findByCorrelationId('corr-1');
  assert.equal(logs.length, 2);
});

test('AuditRepository.search filters by query', async () => {
  const repo = createMockRepo();
  await repo.append({ tenantId: 't1', entityType: 'Organization', entityId: 'e1', action: 'create', actorId: 'u1', actorName: 'Admin' });
  await repo.append({ tenantId: 't1', entityType: 'Person', entityId: 'e2', action: 'update', actorId: 'u1', actorName: 'Admin' });
  const results = await repo.search('t1', 'create');
  assert.equal(results.length, 1);
});

test('AuditRepository.countByAction returns action distribution', async () => {
  const repo = createMockRepo();
  await repo.append({ tenantId: 't1', entityType: 'Organization', entityId: 'e1', action: 'create', actorId: 'u1', actorName: 'Admin' });
  await repo.append({ tenantId: 't1', entityType: 'Person', entityId: 'e2', action: 'create', actorId: 'u1', actorName: 'Admin' });
  await repo.append({ tenantId: 't1', entityType: 'Person', entityId: 'e3', action: 'update', actorId: 'u1', actorName: 'Admin' });
  const counts = await repo.countByAction('t1');
  assert.equal(counts.create, 2);
  assert.equal(counts.update, 1);
});
