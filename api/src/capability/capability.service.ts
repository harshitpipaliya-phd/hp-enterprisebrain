import type { Capability, CreateCapabilityInput, UpdateCapabilityInput, CapabilityAssignment } from './capability.types.js';
import { eventBus, CapabilityEvents } from '@hpbrain/events';

export interface CapabilityRepository {
  create: (input: CreateCapabilityInput) => Promise<Capability>;
  findById: (tenantId: string, id: string) => Promise<Capability | null>;
  findByCode: (tenantId: string, capabilityCode: string) => Promise<Capability | null>;
  list: (tenantId: string, orgId?: string, status?: string, category?: string) => Promise<Capability[]>;
  search: (tenantId: string, query: string, orgId?: string) => Promise<Capability[]>;
  update: (tenantId: string, id: string, patch: UpdateCapabilityInput) => Promise<Capability | null>;
  archive: (tenantId: string, id: string) => Promise<Capability | null>;
  snapshotVersion: (capability: Capability, createdBy: string) => Promise<void>;
  getVersions: (tenantId: string, capabilityId: string) => Promise<Array<{ version: number; name: string; createdDate: string }>>;
  upsertAssignment: (tenantId: string, capabilityId: string, targetType: string, targetId: string, assignedBy: string) => Promise<CapabilityAssignment>;
  removeAssignment: (tenantId: string, capabilityId: string, targetType: string, targetId: string) => Promise<void>;
  getAssignments: (tenantId: string, capabilityId: string) => Promise<CapabilityAssignment[]>;
}

export class CapabilityService {
  constructor(
    private readonly repository: CapabilityRepository,
  ) {}

  async create(input: CreateCapabilityInput): Promise<Capability> {
    const existing = await this.repository.findByCode(input.tenantId, input.capabilityCode);
    if (existing) {
      throw new Error(`Capability with code ${input.capabilityCode} already exists`);
    }
    const capability = await this.repository.create(input);
    await eventBus.publish({
      type: CapabilityEvents.Created,
      tenantId: capability.tenantId,
      entityType: 'Capability',
      entityId: capability.id,
      actorId: input.createdBy,
      payload: { actorName: input.createdBy, capability },
    });
    return capability;
  }

  async get(tenantId: string, id: string): Promise<Capability | null> {
    return this.repository.findById(tenantId, id);
  }

  async list(tenantId: string, orgId?: string, status?: string, category?: string): Promise<Capability[]> {
    return this.repository.list(tenantId, orgId, status, category);
  }

  async search(tenantId: string, query: string, orgId?: string): Promise<Capability[]> {
    return this.repository.search(tenantId, query, orgId);
  }

  async update(tenantId: string, id: string, patch: UpdateCapabilityInput): Promise<Capability | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    if (patch.capabilityCode && patch.capabilityCode !== existing.capabilityCode) {
      const dup = await this.repository.findByCode(tenantId, patch.capabilityCode);
      if (dup) throw new Error(`Capability with code ${patch.capabilityCode} already exists`);
    }
    const updated = await this.repository.update(tenantId, id, patch);
    if (!updated) return null;
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys({ ...existing, ...updated })) {
      if ((existing as any)[key] !== (updated as any)[key]) {
        changes[key] = { from: (existing as any)[key], to: (updated as any)[key] };
      }
    }
    await eventBus.publish({
      type: CapabilityEvents.Updated,
      tenantId: updated.tenantId,
      entityType: 'Capability',
      entityId: updated.id,
      actorId: 'system',
      payload: { actorName: 'system', changes, capability: updated },
    });
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<Capability | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    const archived = await this.repository.archive(tenantId, id);
    if (!archived) return null;
    await eventBus.publish({
      type: CapabilityEvents.Archived,
      tenantId: archived.tenantId,
      entityType: 'Capability',
      entityId: archived.id,
      actorId: 'system',
      payload: { actorName: 'system', capability: archived },
    });
    return archived;
  }

  async createVersion(tenantId: string, id: string, createdBy: string): Promise<Capability | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    await this.repository.snapshotVersion(existing, createdBy);
    const updated = await this.repository.update(tenantId, id, {} as UpdateCapabilityInput);
    if (!updated) return null;
    await eventBus.publish({
      type: CapabilityEvents.VersionChanged,
      tenantId,
      entityType: 'Capability',
      entityId: id,
      actorId: createdBy,
      payload: { actorName: createdBy, capability: updated, version: (existing.version + 1) },
    });
    return updated;
  }

  async getVersions(tenantId: string, capabilityId: string) {
    return this.repository.getVersions(tenantId, capabilityId);
  }

  async assign(tenantId: string, capabilityId: string, targetType: string, targetId: string, assignedBy: string): Promise<CapabilityAssignment> {
    const assignment = await this.repository.upsertAssignment(tenantId, capabilityId, targetType, targetId, assignedBy);
    await eventBus.publish({
      type: CapabilityEvents.Assigned,
      tenantId,
      entityType: 'Capability',
      entityId: capabilityId,
      actorId: assignedBy,
      payload: { actorName: assignedBy, assignment, targetType, targetId },
    });
    return assignment;
  }

  async unassign(tenantId: string, capabilityId: string, targetType: string, targetId: string): Promise<void> {
    await this.repository.removeAssignment(tenantId, capabilityId, targetType, targetId);
  }

  async getAssignments(tenantId: string, capabilityId: string): Promise<CapabilityAssignment[]> {
    return this.repository.getAssignments(tenantId, capabilityId);
  }
}
