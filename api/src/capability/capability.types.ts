export type CapabilityStatus = 'active' | 'inactive' | 'archived' | 'draft';

export interface KasbaElement {
  description?: string;
  level?: number;
  weight?: number;
  evidenceRequired?: boolean;
  measurementMethod?: string;
  targetLevel?: number;
  currentLevel?: number;
}

export interface Capability {
  id: string;
  tenantId: string;
  orgId: string;
  capabilityCode: string;
  name: string;
  description: string | null;
  category: string;
  capabilityType: string;
  difficulty: string;
  criticality: string;
  version: number;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  knowledge: KasbaElement | null;
  ability: KasbaElement | null;
  skill: KasbaElement | null;
  behaviour: KasbaElement | null;
  attitude: KasbaElement | null;
}

export interface CreateCapabilityInput {
  tenantId: string;
  orgId: string;
  capabilityCode: string;
  name: string;
  description?: string | null;
  category?: string;
  capabilityType?: string;
  difficulty?: string;
  criticality?: string;
  createdBy: string;
  knowledge?: KasbaElement | null;
  ability?: KasbaElement | null;
  skill?: KasbaElement | null;
  behaviour?: KasbaElement | null;
  attitude?: KasbaElement | null;
}

export interface UpdateCapabilityInput {
  name?: string;
  description?: string | null;
  category?: string;
  capabilityType?: string;
  difficulty?: string;
  criticality?: string;
  capabilityCode?: string;
  status?: CapabilityStatus;
  knowledge?: KasbaElement | null;
  ability?: KasbaElement | null;
  skill?: KasbaElement | null;
  behaviour?: KasbaElement | null;
  attitude?: KasbaElement | null;
}

export interface CapabilityAssignment {
  id: string;
  tenantId: string;
  capabilityId: string;
  targetType: string;
  targetId: string;
  assignedBy: string;
  assignedDate: string;
  status: string;
}
