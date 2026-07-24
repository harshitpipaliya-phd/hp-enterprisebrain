# FEP-001 — Prototype Mapping

> Maps each screen region/widget to the engineering artifact it binds to. No code.

| Region / Widget | Binds to | Artifact |
|---|---|---|
| Scope bar | `OrgUnit` tree + scope | `SCR-Org-Unit-Tree.md`; `graph/migrations/001_constraints.cypher` (`OrgUnit`) |
| Health tiles | unit/person/capability scores | `OrgUnit`, `Person`, `Capability`, `Outcome`, `Learning` nodes |
| Gap board columns | 8 families | `contracts/taxonomy/root-cause.schema.yaml` |
| Gap card | signal + case | EPIC-003 signal; `Case`, `Hypothesis` nodes |
| Detail drawer | evidence trace | `Evidence` (append-only, `graph/README.md`) |
| ESO recommendation | `trigger.gapTypes` | `ESO` (Block 2); `contracts/dist/ESOContract.d.ts` |
| Act button | trust gate | `executorPolicy.trustLevels` (Block 5); EPIC-007 |
| Learning strip | outcomes | `Outcome`, `Learning` (EPIC-009) |
| Tenant container | isolation | `SCR-Tenant-Home.md`; `.github/workflows/tenant-isolation.yml` |

**Contract consumption rule:** the design system consumes `ESOContract` and the taxonomy enum; it never redefines them (`web/MIGRATION.md`).
