# FEP-001 — Widget Specification

> Widget inventory for the Organization Health Dashboard. No implementation code.

| Widget | Region | Reads | Notes |
|---|---|---|---|
| `ScopeSelector` | Scope bar | `OrgUnit` tree | reuses `SCR-Org-Unit-Tree.md`; scope = unit + descendants |
| `HealthOverview` | Health overview | `OrgUnit`, `Person`, `Capability`, `Outcome` | overall + per-unit score (healthy/watch/critical) |
| `HealthTile` | Health overview | per `OrgUnit` | score + trend sparkline from `Learning` |
| `GapBoard` | Gap board | EPIC-003 signals, `Hypothesis` | 8 columns = root-cause families |
| `GapCard` | Gap board | signal + `Case` link | severity, confidence, family tag |
| `GapDetailDrawer` | Detail | `Evidence`, `Case`, `ESO` | evidence trace, linked Case, recommended ESO(s) |
| `ESORecommendationList` | Detail | `ESO` (Block 2 `gapTypes`) | ranked; greyed if above trust ceiling |
| `ProvenanceTrail` | Detail | `Evidence` | source/system/method/timestamp/confidence/agent/type/version/hash |
| `LearningStrip` | Activity | `Outcome`, `Learning` | recent improvements per unit |
| `ActButton` | Detail | `executorPolicy.trustLevels` (Block 5) | routes to EPIC-007; disabled if above ceiling |

All widgets consume `ESOContract` types where relevant (`web/MIGRATION.md` rule: design system consumes, never defines).
