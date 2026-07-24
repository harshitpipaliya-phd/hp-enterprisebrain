export interface DbTenant {
    id: string;
    name: string;
    region: string;
    status: string;
    createdDate: string;
}
export interface CreateTenantInput {
    name: string;
    region?: string;
}
export interface TenantStats {
    orgUnits: number;
    people: number;
    roles: number;
    esos: number;
}
export declare class TenantRepository {
    create(input: CreateTenantInput): Promise<DbTenant>;
    findById(id: string): Promise<DbTenant | null>;
    activate(id: string): Promise<void>;
    stats(tenantId: string): Promise<TenantStats>;
    private mapRow;
}
