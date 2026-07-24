export interface Notification {
    id: string;
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    entityType: string | null;
    entityId: string | null;
    readDate: string | null;
    createdDate: string;
}
export interface CreateNotificationInput {
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
}
export declare class NotificationRepository {
    create(input: CreateNotificationInput): Promise<Notification>;
    listForUser(tenantId: string, userId: string, unreadOnly?: boolean): Promise<Notification[]>;
    markRead(tenantId: string, userId: string, id: string): Promise<Notification | null>;
    markAllRead(tenantId: string, userId: string): Promise<number>;
    unreadCount(tenantId: string, userId: string): Promise<number>;
    private mapRow;
}
