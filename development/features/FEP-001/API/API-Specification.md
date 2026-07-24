# FEP-001 — API Specification

> References existing contracts; defines the dashboard's read API only where missing. **Never duplicates contracts.**

## Existing anchors
- `graph/migrations/001_constraints.cypher` — every node `tenantId` (enforced).
- `.github/workflows/tenant-isolation.yml` — CI guard (every query needs `tenantId`).
- `contracts/dist/ESOContract.d.ts` — ESO shape consumed by the recommendation list.
- `contracts/taxonomy/root-cause.schema.yaml` — 8 families (consumed, not redefined).

## Missing API surface (to be implemented in `api/`, Laravel)

> No OpenAPI spec exists in `contracts/openapi/` yet (scaffold). These are read endpoints the dashboard needs; defined here as the product capability contract.

### Health aggregation (read-only)
- `GET /api/v1/{tenantId}/health/overview` — overall + per-`OrgUnit` health scores.
- `GET /api/v1/{tenantId}/health/orgunit/{orgUnitId}` — scoped subtree health.
- `GET /api/v1/{tenantId}/health/gaps` — gaps grouped by root-cause family; supports `?family=` and `?orgUnitId=` filters.
- `GET /api/v1/{tenantId}/health/gap/{gapId}` — detail: evidence, linked `Case`, recommended `ESO`s.
- `GET /api/v1/{tenantId}/health/learning` — recent `Outcome`/`Learning` affecting health.

### Cross-cutting rule (all endpoints)
- Every request is implicitly scoped by `tenantId`; `api/` injects `tenantId` into every graph query (exit criterion #6).
- The dashboard is read-only — no mutation endpoints here; writes go through EPIC-004/007/008 APIs.

## Relationship to contracts
- No new ESO/tenant contract added. ESO linkage uses existing `trigger.gapTypes` (Block 2).
- `web/MIGRATION.md` `onDecision` verbs belong to EPIC-007, not this dashboard.
