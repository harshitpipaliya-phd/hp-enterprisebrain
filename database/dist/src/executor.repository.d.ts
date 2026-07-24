import type { ExecutorType } from './decision.repository.js';
export interface Executor {
    id: string;
    tenantId: string;
    executorType: ExecutorType;
    name: string;
    personId: string | null;
    capabilityTags: string[];
    trustLevel: number;
    maxConcurrent: number;
    currentWorkload: number;
    available: boolean;
    status: string;
    createdDate: string;
    updatedDate: string;
}
export interface RegisterExecutorInput {
    tenantId: string;
    executorType: ExecutorType;
    name: string;
    personId?: string | null;
    capabilityTags?: string[];
    trustLevel?: number;
    maxConcurrent?: number;
}
export declare class ExecutorRepository {
    register(input: RegisterExecutorInput): Promise<Executor>;
    findAvailable(tenantId: string, executorType: ExecutorType, requiredCapability?: string): Promise<Executor[]>;
    findById(tenantId: string, id: string): Promise<Executor | null>;
    list(tenantId: string): Promise<Executor[]>;
    adjustWorkload(tenantId: string, id: string, delta: number): Promise<Executor | null>;
    private mapRow;
}
