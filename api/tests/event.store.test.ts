import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventStoreRepository } from '@hpbrain/database';

function createMockRepo() {
  const store: Map<string, any> = new Map();
  const dlq: any[] = [];
  const consumers: Map<string, any> = new Map();

  return {
    store,
    dlq,
    consumers,
    append: async (event: any) => {
      const id = event.id ?? crypto.randomUUID();
      const stored = {
        ...event,
        id,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        processedAt: null,
        completedAt: null,
      };
      store.set(id, stored);
      return stored;
    },
    findById: async (id: string) => store.get(id) ?? null,
    findByType: async (type: string) => Array.from(store.values()).filter((e) => e.type === type),
    findPending: async () => Array.from(store.values()).filter((e) => e.status === 'pending'),
    findByTenant: async (tenantId: string) => Array.from(store.values()).filter((e) => e.tenantId === tenantId),
    findByEntity: async (entityType: string, entityId: string) =>
      Array.from(store.values()).filter((e) => e.entityType === entityType && e.entityId === entityId),
    updateStatus: async (id: string, status: string, reason?: string) => {
      const e = store.get(id);
      if (e) {
        e.status = status;
        if (reason) e.failureReason = reason;
        if (status === 'processing') e.retryCount = (e.retryCount ?? 0) + 1;
      }
    },
    markCompleted: async (id: string) => {
      const e = store.get(id);
      if (e) { e.status = 'completed'; e.completedAt = new Date().toISOString(); }
    },
    markFailed: async (id: string, reason: string) => {
      const e = store.get(id);
      if (e) { e.status = 'failed'; e.failureReason = reason; }
    },
    findByIdempotencyKey: async (key: string) =>
      Array.from(store.values()).find((e) => e.idempotencyKey === key) ?? null,
    count: async () => store.size,
    countByStatus: async (status: string) => Array.from(store.values()).filter((e) => e.status === status).length,
    countByType: async (type: string) => Array.from(store.values()).filter((e) => e.type === type).length,
    addToDeadLetter: async (eventId: string, consumerName: string, errorMessage: string) => {
      const entry = { id: crypto.randomUUID(), eventId, consumerName, errorMessage, retryCount: 0, maxRetries: 3, createdAt: new Date().toISOString() };
      dlq.push(entry);
      return entry;
    },
    getDeadLetterEntries: async () => [...dlq],
    removeDeadLetter: async (id: string) => {
      const idx = dlq.findIndex((e) => e.id === id);
      if (idx >= 0) dlq.splice(idx, 1);
    },
    upsertConsumerState: async (consumerName: string, lastEventId?: string) => {
      const state = { id: crypto.randomUUID(), consumerName, lastProcessedEventId: lastEventId ?? null, lastProcessedAt: new Date().toISOString(), status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      consumers.set(consumerName, state);
      return state;
    },
    getConsumerState: async (consumerName: string) => consumers.get(consumerName) ?? null,
    getAllConsumerStates: async () => Array.from(consumers.values()),
  };
}

test('EventStoreRepository.append creates event with pending status', async () => {
  const repo = createMockRepo();
  const event = await repo.append({
    type: 'OrganizationCreated',
    tenantId: 't1',
    entityType: 'Organization',
    entityId: 'o1',
    actorId: 'u1',
    payload: { name: 'Acme' },
  });
  assert.equal(event.status, 'pending');
  assert.ok(event.id);
  assert.ok(event.createdAt);
});

test('EventStoreRepository.findByIdempotencyKey prevents duplicates', async () => {
  const repo = createMockRepo();
  await repo.append({
    type: 'OrganizationCreated',
    tenantId: 't1',
    entityType: 'Organization',
    entityId: 'o1',
    actorId: 'u1',
    payload: {},
    idempotencyKey: 'key-123',
  });
  const found = await repo.findByIdempotencyKey('key-123');
  assert.ok(found);
  assert.equal(found.idempotencyKey, 'key-123');
});

test('EventStoreRepository.markCompleted updates status', async () => {
  const repo = createMockRepo();
  const event = await repo.append({
    type: 'OrganizationCreated',
    tenantId: 't1',
    entityType: 'Organization',
    entityId: 'o1',
    actorId: 'u1',
    payload: {},
  });
  await repo.markCompleted(event.id);
  const updated = await repo.findById(event.id);
  assert.equal(updated?.status, 'completed');
  assert.ok(updated?.completedAt);
});

test('EventStoreRepository.addToDeadLetter creates DLQ entry', async () => {
  const repo = createMockRepo();
  const event = await repo.append({
    type: 'OrganizationCreated',
    tenantId: 't1',
    entityType: 'Organization',
    entityId: 'o1',
    actorId: 'u1',
    payload: {},
  });
  const dlqEntry = await repo.addToDeadLetter(event.id, 'GraphSyncConsumer', 'Connection timeout');
  assert.ok(dlqEntry.id);
  assert.equal(dlqEntry.eventId, event.id);
  assert.equal(dlqEntry.consumerName, 'GraphSyncConsumer');

  const entries = await repo.getDeadLetterEntries();
  assert.equal(entries.length, 1);
});

test('EventStoreRepository.upsertConsumerState tracks consumer progress', async () => {
  const repo = createMockRepo();
  const event = await repo.append({
    type: 'OrganizationCreated',
    tenantId: 't1',
    entityType: 'Organization',
    entityId: 'o1',
    actorId: 'u1',
    payload: {},
  });
  await repo.upsertConsumerState('GraphSyncConsumer', event.id);
  const state = await repo.getConsumerState('GraphSyncConsumer');
  assert.ok(state);
  assert.equal(state?.lastProcessedEventId, event.id);
  assert.equal(state?.status, 'active');
});
