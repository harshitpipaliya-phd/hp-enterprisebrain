import { BaseRepository } from '../repository/base.js';
export class DepartmentGraphRepository extends BaseRepository {
    async create(input) {
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
        return this.mapDepartment(records[0]);
    }
    async findById(tenantId, id) {
        const cypher = `MATCH (d:Department {tenantId: $tenantId, id: $id}) RETURN d`;
        const { records } = await this.run(cypher, { tenantId, id });
        return records.length ? this.mapDepartment(records[0]) : null;
    }
    async list(tenantId, orgId) {
        const cypher = `MATCH (d:Department {tenantId: $tenantId})${orgId ? ' WHERE d.orgId = $orgId' : ''} RETURN d ORDER BY d.createdDate DESC`;
        const params = { tenantId, ...(orgId ? { orgId } : {}) };
        const { records } = await this.run(cypher, params);
        return records.map((r) => this.mapDepartment(r));
    }
    async update(tenantId, id, patch) {
        const sets = [];
        const params = { tenantId, id };
        if (patch.name !== undefined) {
            sets.push('d.name = $name');
            params.name = patch.name;
        }
        if (patch.description !== undefined) {
            sets.push('d.description = $description');
            params.description = patch.description;
        }
        if (patch.departmentType !== undefined) {
            sets.push('d.departmentType = $departmentType');
            params.departmentType = patch.departmentType;
        }
        if (patch.parentDepartmentId !== undefined) {
            sets.push('d.parentDepartmentId = $parentDepartmentId');
            params.parentDepartmentId = patch.parentDepartmentId;
        }
        if (patch.headId !== undefined) {
            sets.push('d.headId = $headId');
            params.headId = patch.headId;
        }
        if (patch.orgId !== undefined) {
            sets.push('d.orgId = $orgId');
            params.orgId = patch.orgId;
        }
        if (patch.status !== undefined) {
            sets.push('d.status = $status');
            params.status = patch.status;
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const cypher = `MATCH (d:Department {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN d`;
        const { records } = await this.run(cypher, params);
        return records.length ? this.mapDepartment(records[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    mapDepartment(node) {
        return {
            id: node.id,
            tenantId: node.tenantId,
            name: node.name,
            description: node.description ?? null,
            departmentType: node.departmentType,
            parentDepartmentId: node.parentDepartmentId ?? null,
            headId: node.headId ?? null,
            orgId: node.orgId,
            status: node.status,
            createdBy: node.createdBy,
            createdDate: node.createdDate,
            updatedDate: node.updatedDate,
        };
    }
}
