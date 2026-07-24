import { sessionFor, type TenantSession } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
import type { Capability, CreateCapabilityInput, UpdateCapabilityInput } from './capability.types.js';

export class CapabilityGraphRepository extends BaseRepository {
  async create(input: CreateCapabilityInput): Promise<Capability> {
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
    return this.mapCapability(records[0] as Record<string, unknown>);
  }

  async findById(tenantId: string, id: string): Promise<Capability | null> {
    const cypher = `MATCH (c:Capability {tenantId: $tenantId, id: $id}) RETURN c`;
    const { records } = await this.run(cypher, { tenantId, id });
    return records.length ? this.mapCapability(records[0] as Record<string, unknown>) : null;
  }

  async list(tenantId: string, orgId?: string): Promise<Capability[]> {
    const cypher = `MATCH (c:Capability {tenantId: $tenantId})${orgId ? ' WHERE c.orgId = $orgId' : ''} RETURN c ORDER BY c.createdDate DESC`;
    const params: Record<string, unknown> = { tenantId, ...(orgId ? { orgId } : {}) };
    const { records } = await this.run(cypher, params);
    return records.map((r) => this.mapCapability(r as Record<string, unknown>));
  }

  async update(tenantId: string, id: string, patch: UpdateCapabilityInput): Promise<Capability | null> {
    const sets: string[] = [];
    const params: Record<string, unknown> = { tenantId, id };
    if (patch.name !== undefined) { sets.push('c.name = $name'); params.name = patch.name; }
    if (patch.description !== undefined) { sets.push('c.description = $description'); params.description = patch.description; }
    if (patch.category !== undefined) { sets.push('c.category = $category'); params.category = patch.category; }
    if (patch.capabilityType !== undefined) { sets.push('c.capabilityType = $capabilityType'); params.capabilityType = patch.capabilityType; }
    if (patch.difficulty !== undefined) { sets.push('c.difficulty = $difficulty'); params.difficulty = patch.difficulty; }
    if (patch.criticality !== undefined) { sets.push('c.criticality = $criticality'); params.criticality = patch.criticality; }
    if (patch.status !== undefined) { sets.push('c.status = $status'); params.status = patch.status; }
    if (!sets.length) return this.findById(tenantId, id);
    const cypher = `MATCH (c:Capability {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN c`;
    const { records } = await this.run(cypher, params);
    return records.length ? this.mapCapability(records[0] as Record<string, unknown>) : null;
  }

  async archive(tenantId: string, id: string): Promise<Capability | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  private mapCapability(node: Record<string, unknown>): Capability {
    return {
      id: node.id as string,
      tenantId: node.tenantId as string,
      orgId: node.orgId as string,
      capabilityCode: node.capabilityCode as string,
      name: node.name as string,
      description: (node.description as string | null) ?? null,
      category: node.category as string,
      capabilityType: node.capabilityType as string,
      difficulty: node.difficulty as string,
      criticality: node.criticality as string,
      version: Number(node.version),
      status: node.status as string,
      createdBy: node.createdBy as string,
      createdDate: node.createdDate as string,
      updatedDate: node.updatedDate as string,
      knowledge: (node.knowledge as Capability['knowledge']) ?? null,
      ability: (node.ability as Capability['ability']) ?? null,
      skill: (node.skill as Capability['skill']) ?? null,
      behaviour: (node.behaviour as Capability['behaviour']) ?? null,
      attitude: (node.attitude as Capability['attitude']) ?? null,
    };
  }
}
