import { EventStoreRepository } from '@hpbrain/database';
import { eventBus } from '@hpbrain/events';
export class OutboxEventPublisher {
    eventStore;
    constructor(eventStore = new EventStoreRepository()) {
        this.eventStore = eventStore;
    }
    async publish(event) {
        // Check idempotency
        if (event.idempotencyKey) {
            const existing = await this.eventStore.findByIdempotencyKey(event.idempotencyKey);
            if (existing)
                return existing;
        }
        const stored = await this.eventStore.append(event);
        // Also emit to in-memory event bus for real-time consumers
        const domainEvent = {
            type: stored.type,
            tenantId: stored.tenantId,
            entityType: stored.entityType,
            entityId: stored.entityId,
            actorId: stored.actorId,
            payload: stored.payload,
            timestamp: stored.createdAt,
        };
        await eventBus.publish(domainEvent);
        return stored;
    }
}
export class EventDispatcher {
    consumers = new Map();
    eventStore;
    constructor(eventStore = new EventStoreRepository()) {
        this.eventStore = eventStore;
    }
    register(consumer) {
        this.consumers.set(consumer.name, consumer);
    }
    unregister(name) {
        this.consumers.delete(name);
    }
    async dispatch(event) {
        const results = new Map();
        for (const [name, consumer] of this.consumers) {
            try {
                await this.eventStore.updateStatus(event.id, 'processing');
                await consumer.consume(event);
                await this.eventStore.markCompleted(event.id);
                await this.eventStore.upsertConsumerState(consumer.name, event.id);
                results.set(name, { success: true });
            }
            catch (e) {
                const retryCount = event.retryCount + 1;
                if (retryCount >= 3) {
                    await this.eventStore.markFailed(event.id, e.message);
                    await this.eventStore.addToDeadLetter(event.id, consumer.name, e.message, e.stack);
                    results.set(name, { success: false, error: e.message });
                }
                else {
                    await this.eventStore.updateStatus(event.id, 'pending', e.message);
                    results.set(name, { success: false, error: e.message });
                }
            }
        }
        return results;
    }
    async processPending(limit = 100) {
        const pending = await this.eventStore.findPending(limit);
        for (const event of pending) {
            await this.dispatch(event);
        }
        return pending.length;
    }
    getConsumers() {
        return Array.from(this.consumers.keys());
    }
}
