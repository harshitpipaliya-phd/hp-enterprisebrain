export interface Guardian {
    id: string;
    tenantId: string;
    studentPersonId: string;
    firstName: string;
    lastName: string;
    relationship: string;
    email: string | null;
    phone: string | null;
    isPrimaryContact: boolean;
    createdDate: string;
}
export interface CreateGuardianInput {
    tenantId: string;
    studentPersonId: string;
    firstName: string;
    lastName: string;
    relationship: string;
    email?: string;
    phone?: string;
    isPrimaryContact?: boolean;
    createdBy: string;
}
export declare class GuardianRepository {
    create(input: CreateGuardianInput): Promise<Guardian>;
    listForStudent(tenantId: string, studentPersonId: string): Promise<Guardian[]>;
    remove(tenantId: string, id: string): Promise<boolean>;
    private mapRow;
}
