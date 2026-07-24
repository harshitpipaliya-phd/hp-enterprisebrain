# FEP-001 — Acceptance Tests

> Maps acceptance criteria (AcceptanceCriteria.md) to verification.

| # | Criterion | Verification | Source |
|---|---|---|---|
| AC-01 | Tenant-scoped health view | FT-01, FT-06 | `.github/workflows/tenant-isolation.yml` |
| AC-02 | Org-unit scoping | FT-03, BT-02 | `SCR-Org-Unit-Tree.md` |
| AC-03 | Root-cause classification | FT-02, BT-03 | `contracts/taxonomy/root-cause.schema.yaml` |
| AC-04 | ESO linkage by contract | FT-07 | `ESO` Block 2 `trigger.gapTypes` |
| AC-05 | Trust-gated actions | BT-04 | `executorPolicy.trustLevels` (Block 5), F-001.5 |
| AC-06 | Read-only dashboard | code review; no mutation endpoints | `API/API-Specification.md` |
| AC-07 | Provenance visible | FT-08, BT-06 | `graph/README.md` |
| AC-08 | No contract/graph/ADR modification | diff review | repository unchanged except `development/` |

## Traceability
- FT/AC → `graph/migrations/001_constraints.cypher`, `.github/workflows/tenant-isolation.yml`
- BT/AC → `UI/*`, `API/API-Specification.md`, `AI/AI-Logic.md`
