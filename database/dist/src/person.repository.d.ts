export interface Person {
    id: string;
    tenantId: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    email: string;
    phone: string | null;
    profilePhoto: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    employmentType: string;
    employmentStatus: string;
    joiningDate: string | null;
    departmentId: string | null;
    managerId: string | null;
    designation: string | null;
    location: string | null;
    reportingManagerId: string | null;
    orgId: string;
    status: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreatePersonInput {
    tenantId: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    displayName?: string | null;
    email: string;
    phone?: string | null;
    profilePhoto?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    employmentType?: string;
    employmentStatus?: string;
    joiningDate?: string | null;
    departmentId?: string | null;
    managerId?: string | null;
    designation?: string | null;
    location?: string | null;
    reportingManagerId?: string | null;
    orgId: string;
    createdBy: string;
}
export interface UpdatePersonInput {
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string | null;
    email?: string;
    phone?: string | null;
    profilePhoto?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    employmentType?: string;
    employmentStatus?: string;
    joiningDate?: string | null;
    departmentId?: string | null;
    managerId?: string | null;
    designation?: string | null;
    location?: string | null;
    reportingManagerId?: string | null;
    orgId?: string;
    status?: string;
}
export declare class PersonRepository {
    create(input: CreatePersonInput): Promise<Person>;
    findById(tenantId: string, id: string): Promise<Person | null>;
    findByEmployeeId(tenantId: string, employeeId: string): Promise<Person | null>;
    findByEmail(tenantId: string, email: string): Promise<Person | null>;
    list(tenantId: string, orgId?: string, status?: string, departmentId?: string): Promise<Person[]>;
    search(tenantId: string, query: string, orgId?: string): Promise<Person[]>;
    update(tenantId: string, id: string, patch: UpdatePersonInput): Promise<Person | null>;
    archive(tenantId: string, id: string): Promise<Person | null>;
    private mapRow;
}
