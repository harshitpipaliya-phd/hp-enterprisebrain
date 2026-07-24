import { EventEmitter } from 'node:events';

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

class EventBus {
  private bus = new EventEmitter();
  private history: DomainEvent[] = [];

  on(type: string, handler: EventHandler): void {
    this.bus.on(type, handler);
  }

  off(type: string, handler: EventHandler): void {
    this.bus.off(type, handler);
  }

  async publish(event: Omit<DomainEvent, 'timestamp'>): Promise<void> {
    const full: DomainEvent = { ...event, timestamp: new Date().toISOString() };
    this.history.push(full);
    this.bus.emit(full.type, full);
  }

  getHistory(type?: string): DomainEvent[] {
    if (!type) return [...this.history];
    return this.history.filter((e) => e.type === type);
  }
}

export const eventBus = new EventBus();

export const OrganizationEvents = {
  Created: 'OrganizationCreated',
  Updated: 'OrganizationUpdated',
  Archived: 'OrganizationArchived',
} as const;

export const DepartmentEvents = {
  Created: 'DepartmentCreated',
  Updated: 'DepartmentUpdated',
  Archived: 'DepartmentArchived',
} as const;

export const PersonEvents = {
  Created: 'PersonCreated',
  Updated: 'PersonUpdated',
  Archived: 'PersonArchived',
} as const;

export const ManagerChangedEvent = 'ManagerChanged';
export const DepartmentAssignedEvent = 'DepartmentAssigned';

export const CapabilityEvents = {
  Assigned: 'CapabilityAssigned',
  Updated: 'CapabilityUpdated',
  Created: 'CapabilityCreated',
  Archived: 'CapabilityArchived',
  VersionChanged: 'CapabilityVersionChanged',
} as const;

export const SignalEvents = {
  Detected: 'SignalDetected',
  StatusChanged: 'SignalStatusChanged',
} as const;

export const EvidenceEvents = {
  Collected: 'EvidenceCollected',
} as const;

export const ReasoningEvents = {
  StepRecorded: 'ReasoningStepRecorded',
} as const;

export const RecommendationEvents = {
  Generated: 'RecommendationGenerated',
  StatusChanged: 'RecommendationStatusChanged',
} as const;

export const DecisionEvents = {
  Made: 'DecisionMade',
} as const;

export const OutcomeEvents = {
  Captured: 'OutcomeCaptured',
} as const;

export const LearningEvents = {
  Extracted: 'LearningExtracted',
} as const;

export const EsoExecutionEvents = {
  Queued: 'EsoExecutionQueued',
  Transitioned: 'EsoExecutionTransitioned',
} as const;

export const ExecutorEvents = {
  Registered: 'ExecutorRegistered',
} as const;

export const PolicyEvents = {
  Created: 'PolicyCreated',
  VersionCreated: 'PolicyVersionCreated',
} as const;

export const RiskEvents = {
  Assessed: 'RiskAssessed',
  Mitigated: 'RiskMitigated',
} as const;

export const MentalModelEvents = {
  Created: 'MentalModelCreated',
  Reinforced: 'MentalModelReinforced',
} as const;

export const CaseEvents = {
  Opened: 'CaseOpened',
  StatusChanged: 'CaseStatusChanged',
  EvidenceLinked: 'CaseEvidenceLinked',
} as const;

export const HypothesisEvents = {
  Proposed: 'HypothesisProposed',
  Supported: 'HypothesisSupported',
  Rejected: 'HypothesisRejected',
  Confirmed: 'HypothesisConfirmed',
} as const;
