import { EventStoreRepository, type StoredEvent } from '@hpbrain/database';
import { eventBus, type DomainEvent } from '@hpbrain/events';

export type { StoredEvent };

export interface EventConsumer {
  name: string;
  consume: (event: StoredEvent) => Promise<void>;
}

export interface EventPublisher {
  publish: (event: Omit<StoredEvent, 'id' | 'status' | 'retryCount' | 'lastRetryAt' | 'failureReason' | 'createdAt' | 'processedAt' | 'completedAt'>) => Promise<StoredEvent>;
}

export class OutboxEventPublisher implements EventPublisher {
  constructor(
    private readonly eventStore: EventStoreRepository = new EventStoreRepository(),
  ) {}

  async publish(event: Omit<StoredEvent, 'id' | 'status' | 'retryCount' | 'lastRetryAt' | 'failureReason' | 'createdAt' | 'processedAt' | 'completedAt'>): Promise<StoredEvent> {
    // Check idempotency
    if (event.idempotencyKey) {
      const existing = await this.eventStore.findByIdempotencyKey(event.idempotencyKey);
      if (existing) return existing;
    }

    const stored = await this.eventStore.append(event);

    // Also emit to in-memory event bus for real-time consumers
    const domainEvent: DomainEvent = {
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
  private readonly consumers: Map<string, EventConsumer> = new Map();
  private readonly eventStore: EventStoreRepository;

  constructor(eventStore: EventStoreRepository = new EventStoreRepository()) {
    this.eventStore = eventStore;
  }

  register(consumer: EventConsumer): void {
    this.consumers.set(consumer.name, consumer);
  }

  unregister(name: string): void {
    this.consumers.delete(name);
  }

  async dispatch(event: StoredEvent): Promise<Map<string, { success: boolean; error?: string }>> {
    const results = new Map<string, { success: boolean; error?: string }>();

    for (const [name, consumer] of this.consumers) {
      try {
        await this.eventStore.updateStatus(event.id, 'processing');
        await consumer.consume(event);
        await this.eventStore.markCompleted(event.id);
        await this.eventStore.upsertConsumerState(consumer.name, event.id);
        results.set(name, { success: true });
      } catch (e: any) {
        const retryCount = event.retryCount + 1;
        if (retryCount >= 3) {
          await this.eventStore.markFailed(event.id, e.message);
          await this.eventStore.addToDeadLetter(event.id, consumer.name, e.message, e.stack);
          results.set(name, { success: false, error: e.message });
        } else {
          await this.eventStore.updateStatus(event.id, 'pending', e.message);
          results.set(name, { success: false, error: e.message });
        }
      }
    }

    return results;
  }

  async processPending(limit = 100): Promise<number> {
    const pending = await this.eventStore.findPending(limit);
    for (const event of pending) {
      await this.dispatch(event);
    }
    return pending.length;
  }

  getConsumers(): string[] {
    return Array.from(this.consumers.keys());
  }
}
