import { TenantRepository as DbTenantRepository } from '@hpbrain/database';
import type { CreateTenantInput, Tenant, TenantStats } from './tenant.types.js';

export class TenantService {
  private repo = new DbTenantRepository();

  async create(input: CreateTenantInput): Promise<Tenant> {
    const t = await this.repo.create(input);
    return this.mapTenant(t);
  }

  async get(id: string): Promise<Tenant | null> {
    const t = await this.repo.findById(id);
    return t ? this.mapTenant(t) : null;
  }

  async activate(id: string): Promise<void> {
    await this.repo.activate(id);
  }

  async stats(id: string): Promise<TenantStats> {
    return this.repo.stats(id);
  }

  private mapTenant(t: { id: string; name: string; region: string; status: string; createdDate: string }): Tenant {
    return {
      id: t.id,
      name: t.name,
      region: t.region,
      status: t.status as Tenant['status'],
      createdAt: t.createdDate,
    };
  }
}