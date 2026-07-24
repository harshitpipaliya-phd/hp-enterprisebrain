export interface DomainEvent {
    type: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    actorId: string;
    payload: Record<string, unknown>;
    timestamp: string;
}
type EventHandler = (event: DomainEvent) => void | Promise<void>;
declare class EventBus {
    private bus;
    private history;
    on(type: string, handler: EventHandler): void;
    off(type: string, handler: EventHandler): void;
    publish(event: Omit<DomainEvent, 'timestamp'>): Promise<void>;
    getHistory(type?: string): DomainEvent[];
}
export declare const eventBus: EventBus;
export declare const OrganizationEvents: {
    readonly Created: "OrganizationCreated";
    readonly Updated: "OrganizationUpdated";
    readonly Archived: "OrganizationArchived";
};
export {};
