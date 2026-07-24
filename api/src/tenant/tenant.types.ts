/**
 * Tenant types for Sprint 1, Story 1.
 *
 * NOTE: A formal Tenant contract is introduced in Story 8 (Contract Framework).
 * Until then the Tenant shape lives here, typed and documented, and is kept
 * minimal and aligned with the graph `Tenant` node in graph/migrations/002_tenant.cypher.
 */
export interface Tenant {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'provisioning' | 'suspended';
  createdAt: string;
}

export interface CreateTenantInput {
  name: string;
  region?: string;
}

export interface TenantStats {
  orgUnits: number;
  people: number;
  roles: number;
  esos: number;
}
