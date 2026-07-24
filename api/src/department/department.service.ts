import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from './department.types.js';
import { eventBus, DepartmentEvents } from '@hpbrain/events';

export interface DepartmentRepository {
  create: (input: CreateDepartmentInput) => Promise<Department>;
  findById: (tenantId: string, id: string) => Promise<Department | null>;
  list: (tenantId: string, orgId?: string, status?: string) => Promise<Department[]>;
  update: (tenantId: string, id: string, patch: UpdateDepartmentInput) => Promise<Department | null>;
  archive: (tenantId: string, id: string) => Promise<Department | null>;
}

export class DepartmentService {
  constructor(
    private readonly repository: DepartmentRepository,
  ) {}

  async create(input: CreateDepartmentInput): Promise<Department> {
    const dept = await this.repository.create(input);
    await eventBus.publish({
      type: DepartmentEvents.Created,
      tenantId: dept.tenantId,
      entityType: 'Department',
      entityId: dept.id,
      actorId: input.createdBy,
      payload: { actorName: input.createdBy, department: dept },
    });
    return dept;
  }

  async get(tenantId: string, id: string): Promise<Department | null> {
    return this.repository.findById(tenantId, id);
  }

  async list(tenantId: string, orgId?: string, status?: string): Promise<Department[]> {
    return this.repository.list(tenantId, orgId, status);
  }

  async update(tenantId: string, id: string, patch: UpdateDepartmentInput): Promise<Department | null> {
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
      type: DepartmentEvents.Updated,
      tenantId: updated.tenantId,
      entityType: 'Department',
      entityId: updated.id,
      actorId: 'system',
      payload: { actorName: 'system', changes, department: updated },
    });
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<Department | null> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) return null;
    const archived = await this.repository.archive(tenantId, id);
    if (!archived) return null;
    await eventBus.publish({
      type: DepartmentEvents.Archived,
      tenantId: archived.tenantId,
      entityType: 'Department',
      entityId: archived.id,
      actorId: 'system',
      payload: { actorName: 'system', department: archived },
    });
    return archived;
  }
}
