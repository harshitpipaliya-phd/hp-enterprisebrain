export interface ConversationSession {
    id: string;
    tenantId: string;
    orgId: string | null;
    title: string;
    contextType: string | null;
    contextEntityId: string | null;
    pinned: boolean;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateSessionInput {
    tenantId: string;
    orgId?: string | null;
    title?: string;
    contextType?: string | null;
    contextEntityId?: string | null;
    createdBy: string;
}
export type MessageRole = 'user' | 'assistant' | 'system';
export interface ConversationMessage {
    id: string;
    tenantId: string;
    sessionId: string;
    role: MessageRole;
    content: string;
    citations: unknown[];
    createdDate: string;
}
export interface AppendMessageInput {
    tenantId: string;
    sessionId: string;
    role: MessageRole;
    content: string;
    citations?: unknown[];
}
export declare class ConversationRepository {
    createSession(input: CreateSessionInput): Promise<ConversationSession>;
    findSessionById(tenantId: string, id: string): Promise<ConversationSession | null>;
    listSessions(tenantId: string, createdBy?: string): Promise<ConversationSession[]>;
    setPinned(tenantId: string, id: string, pinned: boolean): Promise<ConversationSession | null>;
    rename(tenantId: string, id: string, title: string): Promise<ConversationSession | null>;
    softDelete(tenantId: string, id: string): Promise<boolean>;
    searchSessions(tenantId: string, query: string): Promise<ConversationSession[]>;
    appendMessage(input: AppendMessageInput): Promise<ConversationMessage>;
    getMessages(tenantId: string, sessionId: string): Promise<ConversationMessage[]>;
    private mapSession;
    private mapMessage;
}
