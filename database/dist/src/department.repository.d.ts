export interface Department {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    departmentType: string;
    parentDepartmentId: string | null;
    headId: string | null;
    orgId: string;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateDepartmentInput {
    tenantId: string;
    name: string;
    description?: string;
    departmentType?: string;
    parentDepartmentId?: string | null;
    headId?: string | null;
    orgId: string;
    createdBy: string;
}
export interface UpdateDepartmentInput {
    name?: string;
    description?: string | null;
    departmentType?: string;
    parentDepartmentId?: string | null;
    headId?: string | null;
    orgId?: string;
    status?: string;
}
export declare class DepartmentRepository {
    create(input: CreateDepartmentInput): Promise<Department>;
    findById(tenantId: string, id: string): Promise<Department | null>;
    list(tenantId: string, orgId?: string, status?: string): Promise<Department[]>;
    update(tenantId: string, id: string, patch: UpdateDepartmentInput): Promise<Department | null>;
    archive(tenantId: string, id: string): Promise<Department | null>;
    private mapRow;
}
