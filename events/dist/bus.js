import { EventEmitter } from 'node:events';
class EventBus {
    bus = new EventEmitter();
    history = [];
    on(type, handler) {
        this.bus.on(type, handler);
    }
    off(type, handler) {
        this.bus.off(type, handler);
    }
    async publish(event) {
        const full = { ...event, timestamp: new Date().toISOString() };
        this.history.push(full);
        this.bus.emit(full.type, full);
    }
    getHistory(type) {
        if (!type)
            return [...this.history];
        return this.history.filter((e) => e.type === type);
    }
}
export const eventBus = new EventBus();
export const OrganizationEvents = {
    Created: 'OrganizationCreated',
    Updated: 'OrganizationUpdated',
    Archived: 'OrganizationArchived',
};
export const DepartmentEvents = {
    Created: 'DepartmentCreated',
    Updated: 'DepartmentUpdated',
    Archived: 'DepartmentArchived',
};
export const PersonEvents = {
    Created: 'PersonCreated',
    Updated: 'PersonUpdated',
    Archived: 'PersonArchived',
};
export const ManagerChangedEvent = 'ManagerChanged';
export const DepartmentAssignedEvent = 'DepartmentAssigned';
export const CapabilityEvents = {
    Assigned: 'CapabilityAssigned',
    Updated: 'CapabilityUpdated',
    Created: 'CapabilityCreated',
    Archived: 'CapabilityArchived',
    VersionChanged: 'CapabilityVersionChanged',
};
export const SignalEvents = {
    Detected: 'SignalDetected',
    StatusChanged: 'SignalStatusChanged',
};
export const EvidenceEvents = {
    Collected: 'EvidenceCollected',
};
export const ReasoningEvents = {
    StepRecorded: 'ReasoningStepRecorded',
};
export const RecommendationEvents = {
    Generated: 'RecommendationGenerated',
    StatusChanged: 'RecommendationStatusChanged',
};
export const DecisionEvents = {
    Made: 'DecisionMade',
};
export const OutcomeEvents = {
    Captured: 'OutcomeCaptured',
};
export const LearningEvents = {
    Extracted: 'LearningExtracted',
};
export const EsoExecutionEvents = {
    Queued: 'EsoExecutionQueued',
    Transitioned: 'EsoExecutionTransitioned',
};
export const ExecutorEvents = {
    Registered: 'ExecutorRegistered',
};
export const PolicyEvents = {
    Created: 'PolicyCreated',
    VersionCreated: 'PolicyVersionCreated',
};
export const RiskEvents = {
    Assessed: 'RiskAssessed',
    Mitigated: 'RiskMitigated',
};
export const MentalModelEvents = {
    Created: 'MentalModelCreated',
    Reinforced: 'MentalModelReinforced',
};
export const CaseEvents = {
    Opened: 'CaseOpened',
    StatusChanged: 'CaseStatusChanged',
    EvidenceLinked: 'CaseEvidenceLinked',
};
export const HypothesisEvents = {
    Proposed: 'HypothesisProposed',
    Supported: 'HypothesisSupported',
    Rejected: 'HypothesisRejected',
    Confirmed: 'HypothesisConfirmed',
};
