export interface CapabilityTask {
    id: string;
    tenantId: string;
    capabilityId: string;
    parentTaskId: string | null;
    name: string;
    description: string | null;
    evidenceRequired: boolean;
    status: string;
    createdBy: string;
    createdDate: string;
}
export interface CreateCapabilityTaskInput {
    tenantId: string;
    capabilityId: string;
    parentTaskId?: string;
    name: string;
    description?: string;
    evidenceRequired?: boolean;
    createdBy: string;
}
export declare class CapabilityTaskRepository {
    create(input: CreateCapabilityTaskInput): Promise<CapabilityTask>;
    listForCapability(tenantId: string, capabilityId: string): Promise<CapabilityTask[]>;
    private mapRow;
}
