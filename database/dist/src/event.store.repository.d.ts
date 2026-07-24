export interface StoredEvent {
    id: string;
    type: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    actorId: string;
    payload: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    correlationId: string | null;
    causationId: string | null;
    idempotencyKey: string | null;
    status: string;
    retryCount: number;
    lastRetryAt: string | null;
    failureReason: string | null;
    createdAt: string;
    processedAt: string | null;
    completedAt: string | null;
}
export interface DeadLetterEntry {
    id: string;
    eventId: string;
    consumerName: string;
    errorMessage: string;
    errorStack: string | null;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
}
export interface ConsumerState {
    id: string;
    consumerName: string;
    lastProcessedEventId: string | null;
    lastProcessedAt: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';
export declare class EventStoreRepository {
    append(event: Omit<StoredEvent, 'id' | 'status' | 'retryCount' | 'lastRetryAt' | 'failureReason' | 'createdAt' | 'processedAt' | 'completedAt'> & {
        id?: string;
    }): Promise<StoredEvent>;
    findById(id: string): Promise<StoredEvent | null>;
    findByType(type: string, limit?: number): Promise<StoredEvent[]>;
    findPending(limit?: number): Promise<StoredEvent[]>;
    findByTenant(tenantId: string, limit?: number): Promise<StoredEvent[]>;
    findByEntity(tenantId: string, entityType: string, entityId: string): Promise<StoredEvent[]>;
    updateStatus(id: string, status: EventStatus, failureReason?: string): Promise<void>;
    markCompleted(id: string): Promise<void>;
    markFailed(id: string, reason: string): Promise<void>;
    findByIdempotencyKey(key: string): Promise<StoredEvent | null>;
    count(): Promise<number>;
    countByStatus(status: string): Promise<number>;
    countByType(type: string): Promise<number>;
    addToDeadLetter(eventId: string, consumerName: string, errorMessage: string, errorStack?: string, maxRetries?: number): Promise<DeadLetterEntry>;
    getDeadLetterEntries(limit?: number): Promise<DeadLetterEntry[]>;
    removeDeadLetter(id: string): Promise<void>;
    upsertConsumerState(consumerName: string, lastEventId?: string): Promise<ConsumerState>;
    getConsumerState(consumerName: string): Promise<ConsumerState | null>;
    getAllConsumerStates(): Promise<ConsumerState[]>;
    private mapRow;
    private mapDeadLetter;
    private mapConsumerState;
}
