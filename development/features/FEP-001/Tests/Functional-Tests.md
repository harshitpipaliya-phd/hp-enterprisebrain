# FEP-001 — Functional Tests

> Functional tests for the Organization Health Dashboard. References existing engineering assets; no implementation code.

| # | Test | Expected |
|---|---|---|
| FT-01 | `GET /api/v1/{tenantId}/health/overview` | 200; returns per-unit + overall health scores, all `tenantId`-scoped |
| FT-02 | `GET /api/v1/{tenantId}/health/gaps?family=Capability` | 200; gaps filtered to the Capability family only |
| FT-03 | `GET /api/v1/{tenantId}/health/orgunit/{orgUnitId}` | 200; returns subtree health for the unit + descendants |
| FT-04 | `GET /api/v1/{tenantId}/health/gap/{gapId}` | 200; returns evidence, linked Case, recommended ESOs |
| FT-05 | Dashboard `MATCH` without `tenantId` | build fails via `.github/workflows/tenant-isolation.yml` |
| FT-06 | Cross-tenant health read | returns empty; isolation holds (exit criterion #6) |
| FT-07 | ESO link for a Capability gap | only ESOs with `trigger.gapTypes` containing `Capability` appear |
| FT-08 | Detail drawer provenance | shows source/system/method/timestamp/confidence/agent/type/version/hash from `Evidence` |
