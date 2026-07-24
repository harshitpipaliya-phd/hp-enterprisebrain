export declare const SIGNAL_SOURCES: readonly ["attendance", "leave", "performance", "capability", "learning", "recruitment", "tasks", "external"];
export type SignalSource = (typeof SIGNAL_SOURCES)[number];
export declare const SIGNAL_SEVERITIES: readonly ["low", "medium", "high", "critical"];
export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number];
export declare const SIGNAL_STATUSES: readonly ["new", "triaged", "evidenced", "resolved", "dismissed"];
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];
export declare const SIGNAL_PRIORITIES: readonly ["low", "normal", "high", "urgent"];
export type SignalPriority = (typeof SIGNAL_PRIORITIES)[number];
export interface Signal {
    id: string;
    tenantId: string;
    orgId: string;
    departmentId: string | null;
    source: SignalSource;
    classification: string;
    priority: SignalPriority;
    severity: SignalSeverity;
    confidence: number;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    status: SignalStatus;
    metadata: Record<string, unknown>;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
}
export interface CreateSignalInput {
    tenantId: string;
    orgId: string;
    departmentId?: string | null;
    source: SignalSource;
    classification?: string;
    priority?: SignalPriority;
    severity?: SignalSeverity;
    confidence?: number;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    metadata?: Record<string, unknown>;
    createdBy: string;
}
export interface UpdateSignalStatusInput {
    status: SignalStatus;
}
export declare class SignalRepository {
    create(input: CreateSignalInput): Promise<Signal>;
    findById(tenantId: string, id: string): Promise<Signal | null>;
    list(tenantId: string, orgId?: string, status?: SignalStatus, source?: SignalSource, departmentId?: string): Promise<Signal[]>;
    updateStatus(tenantId: string, id: string, patch: UpdateSignalStatusInput): Promise<Signal | null>;
    private mapRow;
}
