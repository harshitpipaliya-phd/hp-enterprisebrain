# FEP-001 — Dependencies

## Dependencies

### Engineering packages (implementing owners)
- **`api/`** (Laravel — auth, tenancy, REST, owner Vivek) — the only entry point for tenant provisioning and the tenancy REST surface. Currently scaffolded (`.gitkeep`); must implement tenant record CRUD + the tenant-isolation status endpoint.
- **`graph/`** (owner Uma) — `graph/migrations/001_constraints.cypher` provides the `tenantId` constraints already. No schema change required for F-001.1 itself (the boundary is the `tenantId` attribute on every existing node).
- **`infra/`** (DevOps) — environment provisioning for the tenant. Currently scaffolded (`.gitkeep`).
- **`.github/workflows/tenant-isolation.yml`** — already present; enforces `tenantId` on every `MATCH`/`MERGE`.
- **`.github/workflows/contracts.yml`** — already present; regenerates `contracts/dist/`.

### Upstream
- None. F-001.1 is the root feature (no product dependencies).

### Downstream (depend on F-001.1)
- F-001.2 Org Unit Hierarchy, F-001.3 Person & Role, F-001.4 Persona, F-001.5 Trust Gating, and all Epics 002–009.

## Open Decisions (tracked, not resolved here)
- **Engineering Blueprint document missing** — referenced as authority but not in-repo (see `DEVELOPMENT_AUDIT.md` §7). F-001.1 does NOT require it: the authoritative isolation rules already live in `graph/` and `.github/`.
- **Tenant record shape** — no `contracts/` schema governs tenancy yet. F-001.1 tracks the tenant record shape as it emerges in `api/` + `graph/`; it must NOT invent a new contract. When a tenant contract is added to `contracts/`, this FEP aligns to it.
- **Objective enum / executor-class / autonomy conflicts** (in `eso.schema.yaml`) — out of scope for F-001.1; belong to ESO Epics 005/008.
