import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationConsumer } from '../src/events/consumers/notification.consumer.js';
function mockEvent(type) {
    return {
        id: 'evt-1', type, tenantId: 't1', entityType: 'Recommendation', entityId: 'rec-1', actorId: 'u1',
        payload: {}, metadata: null, correlationId: null, causationId: null, idempotencyKey: null,
        status: 'pending', retryCount: 0, lastRetryAt: null, failureReason: null,
    };
}
test('NotificationConsumer creates a notification for a curated event type', async () => {
    const consumer = new NotificationConsumer();
    const created = [];
    consumer.repository = { create: async (input) => { created.push(input); return input; } };
    await consumer.consume(mockEvent('RecommendationGenerated'));
    assert.equal(created.length, 1);
    assert.equal(created[0].userId, 'u1');
    assert.equal(created[0].tenantId, 't1');
});
test('NotificationConsumer skips event types not in the curated list', async () => {
    const consumer = new NotificationConsumer();
    const created = [];
    consumer.repository = { create: async (input) => { created.push(input); return input; } };
    await consumer.consume(mockEvent('SomeUnrelatedInternalEvent'));
    assert.equal(created.length, 0, 'non-curated events must not create notifications');
});
test('NotificationConsumer covers HypothesisRejected and HypothesisConfirmed', async () => {
    const consumer = new NotificationConsumer();
    const created = [];
    consumer.repository = { create: async (input) => { created.push(input); return input; } };
    await consumer.consume(mockEvent('HypothesisRejected'));
    await consumer.consume(mockEvent('HypothesisConfirmed'));
    assert.equal(created.length, 2);
});
