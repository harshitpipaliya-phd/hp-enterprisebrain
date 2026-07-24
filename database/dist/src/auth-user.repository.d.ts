export interface AuthUser {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateAuthUserInput {
    tenantId: string;
    email: string;
    name: string;
    role?: string;
    passwordHash: string;
}
export declare class AuthUserRepository {
    create(input: CreateAuthUserInput): Promise<AuthUser>;
    findByEmail(tenantId: string, email: string): Promise<AuthUser | null>;
    findById(tenantId: string, id: string): Promise<AuthUser | null>;
    updatePassword(tenantId: string, id: string, passwordHash: string): Promise<void>;
    private mapRow;
}
