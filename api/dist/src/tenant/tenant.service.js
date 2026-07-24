import { TenantRepository as DbTenantRepository } from '@hpbrain/database';
export class TenantService {
    repo = new DbTenantRepository();
    async create(input) {
        const t = await this.repo.create(input);
        return this.mapTenant(t);
    }
    async get(id) {
        const t = await this.repo.findById(id);
        return t ? this.mapTenant(t) : null;
    }
    async activate(id) {
        await this.repo.activate(id);
    }
    async stats(id) {
        return this.repo.stats(id);
    }
    mapTenant(t) {
        return {
            id: t.id,
            name: t.name,
            region: t.region,
            status: t.status,
            createdAt: t.createdDate,
        };
    }
}
