# FEP-001 — Business Analysis

## Why this feature exists

HP Enterprise Brain is multi-tenant by design, but the platform currently has isolation *constraints* (`graph/migrations/001_constraints.cypher`) without a *provisioning* capability. F-001.1 exists to originate the tenant boundary so the product can actually onboard enterprises and so every downstream feature has a scope to bind to. It converts a structural rule into an operable, governed capability.

## Who uses it

| Persona | Role in F-001.1 |
|---|---|
| Tenant Administrator | Initiates and configures a new tenant; receives first role. |
| Platform Operator (`infra/`) | Provisions the environment that hosts the tenant. |
| Compliance Auditor | Verifies isolation guarantees (CI status, node scoping). |
| System (runtime) | Creates tenant, binds `tenantId`, enforces constraints. |

## What problem it solves

- No onboarding path → no operable multi-tenant service.
- Per-feature tenancy re-implementation → drift and leakage risk.
- `tenantId` constraint never originated → nodes cannot be created safely.

## KPIs

| KPI | Definition | Target |
|---|---|---|
| Tenant provisioning time | Request → activated tenant | < 1 business day (env-dependent) |
| Isolation pass rate | % of Cypher/queries passing `tenantId` guard | 100% |
| Cross-tenant leakage incidents | Count of reads returning another tenant's nodes | 0 |
| Provisioning success rate | Successful activations / attempts | ≥ 99% |
| Tenant-scoped node coverage | Nodes with non-null `tenantId` | 100% |

## Success Metrics

1. A new tenant can be provisioned end-to-end through `api/`.
2. Zero cross-tenant reads are possible (enforced, not convention).
3. Every node under the tenant carries a non-null `tenantId` (CI-enforced).
4. The tenant-isolation CI workflow passes for all migrations/queries touching the tenant.
5. Auditors can confirm isolation from the Tenant Home screen (`SCR-Tenant-Home.md` IsolationStatusCard).

## Business value

- Enables the product to scale to many enterprises on one codebase.
- Deterministic scoping: every query, API call, and ESO execution is implicitly tenant-bounded.
- Foundation for personalization (EPIC-009) and bounded autonomy governance (EPIC-007).
