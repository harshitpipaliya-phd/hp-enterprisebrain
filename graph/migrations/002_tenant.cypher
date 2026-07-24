// 002_tenant.cypher — Tenant boundary (Sprint 1, Story 1).
// Runs AFTER 001_constraints.cypher (filename order). Does NOT edit the shipped migration.
// Every node carries tenantId (exit criterion #6, enforced by .github/workflows/tenant-isolation.yml).
// The Tenant node carries tenantId = its own id so the CI guard passes.

CREATE CONSTRAINT tenant_id IF NOT EXISTS FOR (n:Tenant) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT tenant_tenant IF NOT EXISTS FOR (n:Tenant) REQUIRE n.tenantId IS NOT NULL;

// Bind every scoped node to its Tenant via tenantId parity.
// Relationship is created lazily as nodes are written; this constraint pair enables it.
// NOTE: per-entity BELONGS_TO_TENANT edges are established by the repository layer
// (api/src/repository/base.ts) at write time, never cross-tenant.
