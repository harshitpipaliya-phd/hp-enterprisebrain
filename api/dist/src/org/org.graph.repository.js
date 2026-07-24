import { BaseRepository } from '../repository/base.js';
export class OrganizationGraphRepository extends BaseRepository {
    async create(input) {
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
        return this.mapOrganization(records[0]);
    }
    async findById(tenantId, id) {
        const cypher = `MATCH (o:Organization {tenantId: $tenantId, id: $id}) RETURN o`;
        const { records } = await this.run(cypher, { tenantId, id });
        return records.length ? this.mapOrganization(records[0]) : null;
    }
    async list(tenantId) {
        const cypher = `MATCH (o:Organization {tenantId: $tenantId}) RETURN o ORDER BY o.createdDate DESC`;
        const { records } = await this.run(cypher, { tenantId });
        return records.map((r) => this.mapOrganization(r));
    }
    async update(tenantId, id, patch) {
        const sets = [];
        const params = { tenantId, id };
        if (patch.name !== undefined) {
            sets.push('o.name = $name');
            params.name = patch.name;
        }
        if (patch.legalName !== undefined) {
            sets.push('o.legalName = $legalName');
            params.legalName = patch.legalName;
        }
        if (patch.orgCode !== undefined) {
            sets.push('o.orgCode = $orgCode');
            params.orgCode = patch.orgCode;
        }
        if (patch.industry !== undefined) {
            sets.push('o.industry = $industry');
            params.industry = patch.industry;
        }
        if (patch.country !== undefined) {
            sets.push('o.country = $country');
            params.country = patch.country;
        }
        if (patch.timezone !== undefined) {
            sets.push('o.timezone = $timezone');
            params.timezone = patch.timezone;
        }
        if (patch.currency !== undefined) {
            sets.push('o.currency = $currency');
            params.currency = patch.currency;
        }
        if (patch.logo !== undefined) {
            sets.push('o.logo = $logo');
            params.logo = patch.logo;
        }
        if (patch.status !== undefined) {
            sets.push('o.status = $status');
            params.status = patch.status;
        }
        if (!sets.length)
            return this.findById(tenantId, id);
        const cypher = `MATCH (o:Organization {tenantId: $tenantId, id: $id}) SET ${sets.join(', ')} RETURN o`;
        const { records } = await this.run(cypher, params);
        return records.length ? this.mapOrganization(records[0]) : null;
    }
    async archive(tenantId, id) {
        return this.update(tenantId, id, { status: 'archived' });
    }
    mapOrganization(node) {
        return {
            id: node.id,
            tenantId: node.tenantId,
            name: node.name,
            legalName: node.legalName ?? null,
            orgCode: node.orgCode,
            industry: node.industry ?? null,
            country: node.country ?? null,
            timezone: node.timezone,
            currency: node.currency,
            logo: node.logo ?? null,
            status: node.status,
            createdBy: node.createdBy,
            createdDate: node.createdDate,
            updatedDate: node.updatedDate,
        };
    }
}
