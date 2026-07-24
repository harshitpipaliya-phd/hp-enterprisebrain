import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '@hpbrain/database';
import { eventBus, OrganizationEvents } from '@hpbrain/events';

export interface OrganizationRepository {
  create: (input: CreateOrganizationInput) => Promise<Organization>;
  findById: (tenantId: string, id: string) => Promise<Organization | null>;
  list: (tenantId: string, status?: string) => Promise<Organization[]>;
  update: (tenantId: string, id: string, patch: UpdateOrganizationInput) => Promise<Organization | null>;
  archive: (tenantId: string, id: string) => Promise<Organization | null>;
}

export class OrganizationService {
  constructor(
    private readonly repository: OrganizationRepository,
  ) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const org = await this.repository.create(input);
    await eventBus.publish({
      type: OrganizationEvents.Created,
      tenantId: org.tenantId,
      entityType: 'Organization',
      entityId: org.id,
      actorId: input.createdBy,
      payload: { actorName: input.createdBy, organization: org },
    });
    return org;
  }

  async get(tenantId: string, id: string): Promise<Organization | null> {
    return this.repository.findById(tenantId, id);
  }

  async list(tenantId: string, status?: string): Promise<Organization[]> {
    return this.repository.list(tenantId, status);
  }

  async update(tenantId: string, id: string, patch: UpdateOrganizationInput): Promise<Organization | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    const updated = await this.repository.update(tenantId, id, patch);
    if (!updated) return null;
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys({ ...existing, ...updated })) {
      if ((existing as any)[key] !== (updated as any)[key]) {
        changes[key] = { from: (existing as any)[key], to: (updated as any)[key] };
      }
    }
    await eventBus.publish({
      type: OrganizationEvents.Updated,
      tenantId: updated.tenantId,
      entityType: 'Organization',
      entityId: updated.id,
      actorId: 'system',
      payload: { actorName: 'system', changes, organization: updated },
    });
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<Organization | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    const archived = await this.repository.archive(tenantId, id);
    if (!archived) return null;
    await eventBus.publish({
      type: OrganizationEvents.Archived,
      tenantId: archived.tenantId,
      entityType: 'Organization',
      entityId: archived.id,
      actorId: 'system',
      payload: { actorName: 'system', organization: archived },
    });
    return archived;
  }
}
