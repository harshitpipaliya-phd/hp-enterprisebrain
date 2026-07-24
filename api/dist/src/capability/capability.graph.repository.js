import { BaseRepository } from '../repository/base.js';
export class CapabilityGraphRepository extends BaseRepository {
    async create(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const cypher = `
      CREATE (c:Capability {
        id: $id, tenantId: $tenantId, orgId: $orgId, capabilityCode: $capabilityCode,
        name: $name, description: $description, category: $category, capabilityType: $capabilityType,
        difficulty: $difficulty, criticality: $criticality, version: 1, status: 'active',
        createdBy: $createdBy, createdDate: $createdDate, updatedDate: $updatedDate
      })
      RETURN c`;
        const { records } = await this.run(cypher, {
            id,
            tenantId: input.tenantId,
            orgId: input.orgId,
            capabilityCode: input.capabilityCode,
            name: input.name,
            description: input.description ?? null,
            category: input.category ?? 'general',
            capabilityType: input.capabilityType ?? 'competency',
            difficulty: input.difficulty ?? 'intermediate',
            criticality: input.criticality ?? 'medium',
            createdBy: input.createdBy,
            createdDate: now,
            updatedDate: now,
        });
        return this.mapCapability(records[0]);
    }
    async findById(tenantId, id) {
        const cypher = `MATCH (c:Capability {tenantId: $tenantId, id: $id}) RETURN c`;
        const { records } = await this.run(cypher, { tenantId, id });
        return records.length ? this.mapCapability(records[0]) : null;
    }
    async list(tenantId, orgId) {
        const cypher = `MATCH (c:Capability {tenantId: $tenantId})${orgId ? ' WHERE c.orgId = $orgId' : ''} RETURN c ORDER BY c.createdDate DESC`;
        const params = { tenantId, ...(orgId ? { orgId } : {}) };
        const { records } = await this.run(cypher, params);
        return records.map((r) => this.mapCapability(r));
    }
    async update(tenantId, id, patch) {
        const sets = [];
        const params = { tenantId, id };
        if (patch.name !== undefined) {
            sets.push('c.name = $name');
            params.name = patch.name;
        }
        if (patch.description !== undefined) {
            sets.push('c.description = $description');
            params.description = patch.description;
        }
        if (patch.category !== undefined) {
            sets.push('c.category = $category');
            params.category = patch.category;
        }
        if (patch.capabilityType !== undefined) {
            sets.push('c.capabilityType = $capabilityType');
            params.capabilityType = patch.capabilityType;
        }
        if (patch.difficulty !== undefined) {
            sets.push('c.difficulty = $difficulty');
            params.difficulty = patch.difficulty;
        }
        if (patch.criticality !== undefined) {
            sets.push('c.criticality = $criticality');
            params.criticality = patch.criticality;
        }
        if (patch.status !== undefined) {
            sets.push('c.status = $status');
            params.status = patch.status;
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const cypher = `MATCH (c:Capability {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN c`;
        const { records } = await this.run(cypher, params);
        return records.length ? this.mapCapability(records[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    mapCapability(node) {
        return {
            id: node.id,
            tenantId: node.tenantId,
            orgId: node.orgId,
            capabilityCode: node.capabilityCode,
            name: node.name,
            description: node.description ?? null,
            category: node.category,
            capabilityType: node.capabilityType,
            difficulty: node.difficulty,
            criticality: node.criticality,
            version: Number(node.version),
            status: node.status,
            createdBy: node.createdBy,
            createdDate: node.createdDate,
            updatedDate: node.updatedDate,
            knowledge: node.knowledge ?? null,
            ability: node.ability ?? null,
            skill: node.skill ?? null,
            behaviour: node.behaviour ?? null,
            attitude: node.attitude ?? null,
        };
    }
}
