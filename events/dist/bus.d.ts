export interface DomainEvent {
    type: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    actorId: string;
    payload: Record<string, unknown>;
    timestamp: string;
}
type EventHandler = (event: DomainEvent) => void | Promise<void>;
declare class EventBus {
    private bus;
    private history;
    on(type: string, handler: EventHandler): void;
    off(type: string, handler: EventHandler): void;
    publish(event: Omit<DomainEvent, 'timestamp'>): Promise<void>;
    getHistory(type?: string): DomainEvent[];
}
export declare const eventBus: EventBus;
export declare const OrganizationEvents: {
    readonly Created: "OrganizationCreated";
    readonly Updated: "OrganizationUpdated";
    readonly Archived: "OrganizationArchived";
};
export declare const DepartmentEvents: {
    readonly Created: "DepartmentCreated";
    readonly Updated: "DepartmentUpdated";
    readonly Archived: "DepartmentArchived";
};
export declare const PersonEvents: {
    readonly Created: "PersonCreated";
    readonly Updated: "PersonUpdated";
    readonly Archived: "PersonArchived";
};
export declare const ManagerChangedEvent = "ManagerChanged";
export declare const DepartmentAssignedEvent = "DepartmentAssigned";
export declare const CapabilityEvents: {
    readonly Assigned: "CapabilityAssigned";
    readonly Updated: "CapabilityUpdated";
    readonly Created: "CapabilityCreated";
    readonly Archived: "CapabilityArchived";
    readonly VersionChanged: "CapabilityVersionChanged";
};
export declare const SignalEvents: {
    readonly Detected: "SignalDetected";
    readonly StatusChanged: "SignalStatusChanged";
};
export declare const EvidenceEvents: {
    readonly Collected: "EvidenceCollected";
};
export declare const ReasoningEvents: {
    readonly StepRecorded: "ReasoningStepRecorded";
};
export declare const RecommendationEvents: {
    readonly Generated: "RecommendationGenerated";
    readonly StatusChanged: "RecommendationStatusChanged";
};
export declare const DecisionEvents: {
    readonly Made: "DecisionMade";
};
export declare const OutcomeEvents: {
    readonly Captured: "OutcomeCaptured";
};
export declare const LearningEvents: {
    readonly Extracted: "LearningExtracted";
};
export declare const EsoExecutionEvents: {
    readonly Queued: "EsoExecutionQueued";
    readonly Transitioned: "EsoExecutionTransitioned";
};
export declare const ExecutorEvents: {
    readonly Registered: "ExecutorRegistered";
};
export declare const PolicyEvents: {
    readonly Created: "PolicyCreated";
    readonly VersionCreated: "PolicyVersionCreated";
};
export declare const RiskEvents: {
    readonly Assessed: "RiskAssessed";
    readonly Mitigated: "RiskMitigated";
};
export declare const MentalModelEvents: {
    readonly Created: "MentalModelCreated";
    readonly Reinforced: "MentalModelReinforced";
};
export declare const CaseEvents: {
    readonly Opened: "CaseOpened";
    readonly StatusChanged: "CaseStatusChanged";
    readonly EvidenceLinked: "CaseEvidenceLinked";
};
export declare const HypothesisEvents: {
    readonly Proposed: "HypothesisProposed";
    readonly Supported: "HypothesisSupported";
    readonly Rejected: "HypothesisRejected";
    readonly Confirmed: "HypothesisConfirmed";
};
export {};
