# FEP-001 — Data Sources

> Data sources the Organization Health Dashboard reads. Internal sources are enterprise systems; external sources inform benchmarks. The dashboard is **read-centric** — it consumes, it does not ingest.

## Internal Data Sources (consumed by the dashboard)

| # | Source | Provides | Graph/Contract ref |
|---|---|---|---|
| 1 | **Org Unit registry** | org hierarchy for scope + roll-ups | `OrgUnit` (`001_constraints.cypher`); `SCR-Org-Unit-Tree.md` |
| 2 | **People & Roles** | workforce, role distribution, capability holders | `Person`, `Role` |
| 3 | **Capabilities / Skills** | competency map per unit/person | `Capability`; ESO Block 1 `kasbaBinding` |
| 4 | **Evidence ledger** | provenance-bearing facts underlying health | `Evidence` (append-only, `graph/README.md`) |
| 5 | **Cases & Hypotheses** | open investigations, root-cause classifications | `Case`, `Hypothesis` |
| 6 | **Signals (EPIC-003 output)** | detected gaps classified by root-cause family | produced by EPIC-003; consumed here |
| 7 | **ESO catalogue** | candidate remediations + `trigger.gapTypes` | `ESO`; ESO Block 2 |
| 8 | **Outcomes & Learning** | result of past actions, calibration signal | `Outcome`, `Learning` (EPIC-009) |
| 9 | **Executor / trust policy** | who may act, at what autonomy | `Executor`; ESO Block 5 |

## External Data Sources (context only — not ingested by this feature)

| # | Source | Provides | Used for |
|---|---|---|---|
| 1 | **Government / compliance** | regulatory thresholds | benchmark guardrails |
| 2 | **Job Market** | labor-market signals | external root-cause context (`External` family) |
| 3 | **Industry** | benchmarks, taxonomies | comparative health |
| 4 | **Policies** | internal policy corpus | `Policy` root-cause family context |

## Data-handling rules (from `graph/README.md`)
- Every fact carries provenance: source, system, method, timestamp, confidence, agent, type, version, hash.
- Provenance cannot be backfilled.
- All reads are scoped by `tenantId`.
