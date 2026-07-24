import { sessionFor, type TenantSession } from '../neo4j/client.js';
import { BaseRepository } from '../repository/base.js';
import type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '@hpbrain/database';

export class OrganizationGraphRepository extends BaseRepository {
  async create(input: CreateOrganizationInput): Promise<Organization> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const cypher = `
      CREATE (o:Organization {
        id: $id, tenantId: $tenantId, name: $name, legalName: $legalName,
        orgCode: $orgCode, industry: $industry, country: $country,
        timezone: $timezone, currency: $currency, logo: $logo,
        status: 'active', createdBy: $createdBy, createdDate: $createdDate, updatedDate: $updatedDate
      })
      RETURN o`;
      const { records } = await this.run(cypher, {
      id,
      tenantId: input.tenantId,
      name: input.name,
      legalName: input.legalName ?? null,
      orgCode: input.orgCode,
      industry: input.industry ?? null,
      country: input.country ?? null,
      timezone: input.timezone ?? 'UTC',
      currency: input.currency ?? 'USD',
      logo: input.logo ?? null,
      status: 'active',
      createdBy: input.createdBy,
      createdDate: now,
      updatedDate: now,
    });
    return this.mapOrganization(records[0] as Record<string, unknown>);
  }

  async findById(tenantId: string, id: string): Promise<Organization | null> {
    const cypher = `MATCH (o:Organization {tenantId: $tenantId, id: $id}) RETURN o`;
    const { records } = await this.run(cypher, { tenantId, id });
    return records.length ? this.mapOrganization(records[0] as Record<string, unknown>) : null;
  }

  async list(tenantId: string): Promise<Organization[]> {
    const cypher = `MATCH (o:Organization {tenantId: $tenantId}) RETURN o ORDER BY o.createdDate DESC`;
    const { records } = await this.run(cypher, { tenantId });
    return records.map((r) => this.mapOrganization(r as Record<string, unknown>));
  }

  async update(tenantId: string, id: string, patch: UpdateOrganizationInput): Promise<Organization | null> {
    const sets: string[] = [];
    const params: Record<string, unknown> = { tenantId, id };
    if (patch.name !== undefined) { sets.push('o.name = $name'); params.name = patch.name; }
    if (patch.legalName !== undefined) { sets.push('o.legalName = $legalName'); params.legalName = patch.legalName; }
    if (patch.orgCode !== undefined) { sets.push('o.orgCode = $orgCode'); params.orgCode = patch.orgCode; }
    if (patch.industry !== undefined) { sets.push('o.industry = $industry'); params.industry = patch.industry; }
    if (patch.country !== undefined) { sets.push('o.country = $country'); params.country = patch.country; }
    if (patch.timezone !== undefined) { sets.push('o.timezone = $timezone'); params.timezone = patch.timezone; }
    if (patch.currency !== undefined) { sets.push('o.currency = $currency'); params.currency = patch.currency; }
    if (patch.logo !== undefined) { sets.push('o.logo = $logo'); params.logo = patch.logo; }
    if (patch.status !== undefined) { sets.push('o.status = $status'); params.status = patch.status; }
    if (!sets.length) return this.findById(tenantId, id);
    const cypher = `MATCH (o:Organization {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN o`;
    const { records } = await this.run(cypher, params);
    return records.length ? this.mapOrganization(records[0] as Record<string, unknown>) : null;
  }

  async archive(tenantId: string, id: string): Promise<Organization | null> {
    return this.update(tenantId, id, { status: 'archived' });
  }

  private mapOrganization(node: Record<string, unknown>): Organization {
    return {
      id: node.id as string,
      tenantId: node.tenantId as string,
      name: node.name as string,
      legalName: (node.legalName as string | null) ?? null,
      orgCode: node.orgCode as string,
      industry: (node.industry as string | null) ?? null,
      country: (node.country as string | null) ?? null,
      timezone: node.timezone as string,
      currency: node.currency as string,
      logo: (node.logo as string | null) ?? null,
      status: node.status as Organization['status'],
      createdBy: node.createdBy as string,
      createdDate: node.createdDate as string,
      updatedDate: node.updatedDate as string,
    };
  }
}
