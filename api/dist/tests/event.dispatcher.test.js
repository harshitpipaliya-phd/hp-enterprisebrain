import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventDispatcher } from '../src/events/event.backbone.js';
function createMockEventStore() {
    const events = new Map();
    const dlq = [];
    const consumerStates = new Map();
    return {
        events,
        dlq,
        consumerStates,
        append: async (event) => {
            const id = crypto.randomUUID();
            const stored = { ...event, id, status: 'pending', retryCount: 0, createdAt: new Date().toISOString() };
            events.set(id, stored);
            return stored;
        },
        findById: async (id) => events.get(id) ?? null,
        findPending: async () => Array.from(events.values()).filter((e) => e.status === 'pending'),
        updateStatus: async (id, status, reason) => {
            const e = events.get(id);
            if (e) {
                e.status = status;
                if (reason)
                    e.failureReason = reason;
            }
        },
        markCompleted: async (id) => {
            const e = events.get(id);
            if (e) {
                e.status = 'completed';
                e.completedAt = new Date().toISOString();
            }
        },
        markFailed: async (id, reason) => {
            const e = events.get(id);
            if (e) {
                e.status = 'failed';
                e.failureReason = reason;
            }
        },
        findByIdempotencyKey: async () => null,
        count: async () => events.size,
        countByStatus: async (status) => Array.from(events.values()).filter((e) => e.status === status).length,
        addToDeadLetter: async (eventId, consumerName, errorMessage) => {
            dlq.push({ id: crypto.randomUUID(), eventId, consumerName, errorMessage });
        },
        getDeadLetterEntries: async () => [...dlq],
        removeDeadLetter: async (id) => {
            const idx = dlq.findIndex((e) => e.id === id);
            if (idx >= 0)
                dlq.splice(idx, 1);
        },
        upsertConsumerState: async (consumerName, lastEventId) => {
            const state = { consumerName, lastProcessedEventId: lastEventId ?? null, lastProcessedAt: new Date().toISOString(), status: 'active' };
            consumerStates.set(consumerName, state);
            return state;
        },
        getConsumerState: async (consumerName) => consumerStates.get(consumerName) ?? null,
        getAllConsumerStates: async () => Array.from(consumerStates.values()),
    };
}
test('EventDispatcher.register adds consumer', async () => {
    const store = createMockEventStore();
    const dispatcher = new EventDispatcher(store);
    const consumer = { name: 'TestConsumer', consume: async () => { } };
    dispatcher.register(consumer);
    assert.ok(dispatcher.getConsumers().includes('TestConsumer'));
});
test('EventDispatcher.dispatch calls consumer and marks completed', async () => {
    const store = createMockEventStore();
    const dispatcher = new EventDispatcher(store);
    let consumed = null;
    dispatcher.register({
        name: 'TestConsumer',
        consume: async (event) => { consumed = event; },
    });
    const event = await store.append({
        type: 'OrganizationCreated',
        tenantId: 't1',
        entityType: 'Organization',
        entityId: 'o1',
        actorId: 'u1',
        payload: {},
    });
    const results = await dispatcher.dispatch(event);
    assert.ok(results.get('TestConsumer')?.success);
    assert.equal(consumed?.id, event.id);
    const updated = await store.findById(event.id);
    assert.equal(updated?.status, 'completed');
});
test('EventDispatcher.dispatch handles consumer failure with retry', async () => {
    const store = createMockEventStore();
    const dispatcher = new EventDispatcher(store);
    let attempts = 0;
    dispatcher.register({
        name: 'FailingConsumer',
        consume: async () => {
            attempts++;
            throw new Error('Simulated failure');
        },
    });
    const event = await store.append({
        type: 'OrganizationCreated',
        tenantId: 't1',
        entityType: 'Organization',
        entityId: 'o1',
        actorId: 'u1',
        payload: {},
    });
    const results = await dispatcher.dispatch(event);
    assert.ok(!results.get('FailingConsumer')?.success);
    // Should be back to pending for retry (retry count < 3)
    const updated = await store.findById(event.id);
    assert.equal(updated?.status, 'pending');
    assert.equal(attempts, 1);
});
test('EventDispatcher.processPending processes all pending events', async () => {
    const store = createMockEventStore();
    const dispatcher = new EventDispatcher(store);
    let count = 0;
    dispatcher.register({
        name: 'CountConsumer',
        consume: async () => { count++; },
    });
    await store.append({ type: 'T1', tenantId: 't1', entityType: 'E', entityId: '1', actorId: 'u1', payload: {} });
    await store.append({ type: 'T2', tenantId: 't1', entityType: 'E', entityId: '2', actorId: 'u1', payload: {} });
    const processed = await dispatcher.processPending(100);
    assert.equal(processed, 2);
    assert.equal(count, 2);
});
