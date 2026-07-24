export interface Setting {
    tenantId: string;
    userId: string;
    key: string;
    value: unknown;
    updatedDate: string;
}
export declare class SettingsRepository {
    get(tenantId: string, key: string, userId?: string): Promise<unknown | null>;
    set(tenantId: string, key: string, value: unknown, userId?: string): Promise<Setting>;
    listForScope(tenantId: string, userId?: string): Promise<Setting[]>;
    private mapRow;
}
