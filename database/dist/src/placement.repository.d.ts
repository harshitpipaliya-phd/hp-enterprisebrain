export interface PlacementCompany {
    id: string;
    tenantId: string;
    name: string;
    industry: string | null;
    preferredSkills: string[];
    notes: string | null;
}
export interface PlacementJobRole {
    id: string;
    tenantId: string;
    companyId: string;
    title: string;
    description: string | null;
    minSalary: number | null;
    maxSalary: number | null;
    status: string;
}
export interface JobRoleRequirement {
    jobRoleId: string;
    capabilityId: string;
    requiredLevel: number;
}
export declare class PlacementRepository {
    createCompany(tenantId: string, name: string, industry: string | undefined, preferredSkills: string[] | undefined, notes: string | undefined, createdBy: string): Promise<PlacementCompany>;
    listCompanies(tenantId: string): Promise<PlacementCompany[]>;
    createJobRole(tenantId: string, companyId: string, title: string, description: string | undefined, minSalary: number | undefined, maxSalary: number | undefined, createdBy: string): Promise<PlacementJobRole>;
    listJobRoles(tenantId: string, companyId?: string): Promise<PlacementJobRole[]>;
    setRequirement(tenantId: string, jobRoleId: string, capabilityId: string, requiredLevel: number): Promise<void>;
    getRequirements(tenantId: string, jobRoleId: string): Promise<JobRoleRequirement[]>;
    private mapCompany;
    private mapJobRole;
}
