export interface ApiKey {
    id: string;
    tenantId: string;
    userId: string;
    name: string;
    keyPrefix: string;
    lastUsedDate: string | null;
    revokedDate: string | null;
    createdDate: string;
    expiresDate: string | null;
}
export declare class ApiKeyRepository {
    create(tenantId: string, userId: string, name: string, expiresDate?: string): Promise<{
        apiKey: ApiKey;
        rawKey: string;
    }>;
    verify(rawKey: string): Promise<ApiKey | null>;
    listForUser(tenantId: string, userId: string): Promise<ApiKey[]>;
    revoke(tenantId: string, userId: string, id: string): Promise<boolean>;
    private mapRow;
}
