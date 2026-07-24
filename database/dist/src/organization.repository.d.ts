export interface Organization {
    id: string;
    tenantId: string;
    name: string;
    legalName: string | null;
    orgCode: string;
    industry: string | null;
    country: string | null;
    timezone: string;
    currency: string;
    logo: string | null;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateOrganizationInput {
    tenantId: string;
    name: string;
    legalName?: string;
    orgCode: string;
    industry?: string;
    country?: string;
    timezone?: string;
    currency?: string;
    logo?: string;
    createdBy: string;
}
export interface UpdateOrganizationInput {
    name?: string;
    legalName?: string | null;
    orgCode?: string;
    industry?: string | null;
    country?: string | null;
    timezone?: string;
    currency?: string;
    logo?: string | null;
    status?: string;
}
export declare class OrganizationRepository {
    create(input: CreateOrganizationInput): Promise<Organization>;
    findById(tenantId: string, id: string): Promise<Organization | null>;
    findByOrgCode(tenantId: string, orgCode: string): Promise<Organization | null>;
    list(tenantId: string, status?: string): Promise<Organization[]>;
    update(tenantId: string, id: string, patch: UpdateOrganizationInput): Promise<Organization | null>;
    archive(tenantId: string, id: string): Promise<Organization | null>;
    private mapRow;
}
