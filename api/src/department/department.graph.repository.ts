import { sessionFor, type TenantSession } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
import type { Department, CreateDepartmentInput, UpdateDepartmentInput } from './department.types.js';

export class DepartmentGraphRepository extends BaseRepository {
  async create(input: CreateDepartmentInput): Promise<Department> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cypher = `
      CREATE (d:Department {
        id: $id, tenantId: $tenantId, name: $name, description: $description,
        departmentType: $departmentType, parentDepartmentId: $parentDepartmentId,
        headId: $headId, orgId: $orgId, status: 'active',
        createdBy: $createdBy, createdDate: $createdDate, updatedDate: $updatedDate
      })
      RETURN d`;
    const { records } = await this.run(cypher, {
      id,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description ?? null,
      departmentType: input.departmentType ?? 'department',
      parentDepartmentId: input.parentDepartmentId ?? null,
      headId: input.headId ?? null,
      orgId: input.orgId,
      createdBy: input.createdBy,
      createdDate: now,
      updatedDate: now,
    });
    return this.mapDepartment(records[0] as Record<string, unknown>);
  }

  async findById(tenantId: string, id: string): Promise<Department | null> {
    const cypher = `MATCH (d:Department {tenantId: $tenantId, id: $id}) RETURN d`;
    const { records } = await this.run(cypher, { tenantId, id });
    return records.length ? this.mapDepartment(records[0] as Record<string, unknown>) : null;
  }

  async list(tenantId: string, orgId?: string): Promise<Department[]> {
    const cypher = `MATCH (d:Department {tenantId: $tenantId})${orgId ? ' WHERE d.orgId = $orgId' : ''} RETURN d ORDER BY d.createdDate DESC`;
    const params: Record<string, unknown> = { tenantId, ...(orgId ? { orgId } : {}) };
    const { records } = await this.run(cypher, params);
    return records.map((r) => this.mapDepartment(r as Record<string, unknown>));
  }

  async update(tenantId: string, id: string, patch: UpdateDepartmentInput): Promise<Department | null> {
    const sets: string[] = [];
    const params: Record<string, unknown> = { tenantId, id };
    if (patch.name !== undefined) { sets.push('d.name = $name'); params.name = patch.name; }
    if (patch.description !== undefined) { sets.push('d.description = $description'); params.description = patch.description; }
    if (patch.departmentType !== undefined) { sets.push('d.departmentType = $departmentType'); params.departmentType = patch.departmentType; }
    if (patch.parentDepartmentId !== undefined) { sets.push('d.parentDepartmentId = $parentDepartmentId'); params.parentDepartmentId = patch.parentDepartmentId; }
    if (patch.headId !== undefined) { sets.push('d.headId = $headId'); params.headId = patch.headId; }
    if (patch.orgId !== undefined) { sets.push('d.orgId = $orgId'); params.orgId = patch.orgId; }
    if (patch.status !== undefined) { sets.push('d.status = $status'); params.status = patch.status; }
    if (!sets.length) return this.findById(tenantId, id);
    const cypher = `MATCH (d:Department {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN d`;
    const { records } = await this.run(cypher, params);
    return records.length ? this.mapDepartment(records[0] as Record<string, unknown>) : null;
  }

  async archive(tenantId: string, id: string): Promise<Department | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  private mapDepartment(node: Record<string, unknown>): Department {
    return {
      id: node.id as string,
      tenantId: node.tenantId as string,
      name: node.name as string,
      description: (node.description as string | null) ?? null,
      departmentType: node.departmentType as Department['departmentType'],
      parentDepartmentId: (node.parentDepartmentId as string | null) ?? null,
      headId: (node.headId as string | null) ?? null,
      orgId: node.orgId as string,
      status: node.status as Department['status'],
      createdBy: node.createdBy as string,
      createdDate: node.createdDate as string,
      updatedDate: node.updatedDate as string,
    };
  }
}
