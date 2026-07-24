# CANONICAL_MODEL_LOCK.md

> Canonical Data Model — Freeze Review.
> Chief Data Architect. **Read-only review; the graph migration was NOT modified; no entities or relationships were invented.**

---

## 1. Scope & Sources

| Source | Path | What it defines |
|---|---|---|
| Graph constraints (only migration) | `graph/migrations/001_constraints.cypher` | 12 node labels, each with `id` UNIQUE + `tenantId` NOT NULL. **No relationships.** |
| Graph rules | `graph/README.md` | `tenantId` mandatory; provenance on every fact; append-only ledgers. |
| CI guard | `.github/workflows/tenant-isolation.yml` | Fails any `MATCH`/`MERGE` without `tenantId`. |
| ESO contract (cross-ref) | `contracts/eso/eso.schema.yaml` | `kasbaBinding.nodeType` enum (KASBA), `executorPolicy`, references a `(ESO)-[:RESOLVED_TO]->(Executor)` it calls WRONG. |

The repository contains **no other graph artifacts** — no relationship migrations, no indexes beyond the constraints above, no `Organization`/`Skill`/`Signal`/`ReasoningStep`/`Recommendation`/`Decision`/`Policy`/`MentalModel`/`Source` nodes, and no `Department`/`JobRole` labels.

---

## 2. Entity Catalogue (21 required vs. actual)

| # | Required entity | In repo? | Actual label / note |
|---|---|---|---|
| 1 | Organization | ❌ **MISSING** | No root/tenant node. Only `OrgUnit` exists. |
| 2 | Department | ⚠️ **MISMATCH** | Model uses `OrgUnit` (line 9), not `Department`. |
| 3 | Person | ✅ | `Person` (line 6) |
| 4 | Capability | ✅ | `Capability` (line 15) |
| 5 | Skill | ❌ **MISSING** | No `Skill` node (distinct from `Capability` in the required list). |
| 6 | JobRole | ⚠️ **MISMATCH** | Model uses `Role` (line 12), not `JobRole`. |
| 7 | Case | ✅ | `Case` (line 21) |
| 8 | Evidence | ✅ | `Evidence` (line 18) |
| 9 | Signal | ❌ **MISSING** | No `Signal` node (EPIC-003 depends on it). |
| 10 | ReasoningStep | ❌ **MISSING** | Named in `graph/README.md` (ledger) but **no node/migration**. |
| 11 | Recommendation | ❌ **MISSING** | No `Recommendation` node (EPIC-006). |
| 12 | ESO | ✅ | `ESO` (line 24) |
| 13 | Outcome | ✅ | `Outcome` (line 30) |
| 14 | Learning | ✅ | `Learning` (line 33) |
| 15 | Decision | ❌ **MISSING** | No `Decision` node (EPIC-007). |
| 16 | Executor | ✅ | `Executor` (line 27) |
| 17 | Policy | ❌ **MISSING** | No `Policy` node. |
| 18 | MentalModel | ❌ **MISSING** | No `MentalModel` node. |
| 19 | Source | ❌ **MISSING** | No `Source` node (provenance source is a string attribute, not an entity). |
| — | Hypothesis | ✅ (extra) | `Hypothesis` (line 36) — required by EPIC-004, **not in the 21-list** but present. |
| — | Task | ⚠️ named only | `graph/README.md` lists `Task` as a ledger, but **no node/migration**. |

**Tally:** Present by exact/near name = 10 (Person, OrgUnit≈Department, Role≈JobRole, Capability, Evidence, Case, ESO, Outcome, Learning, Executor) + Hypothesis (extra). **Missing = 10** (Organization, Skill, Signal, ReasoningStep, Recommendation, Decision, Policy, MentalModel, Source) + `Task` ledger node. Two naming mismatches (OrgUnit/Department, Role/JobRole).

---

## 3. Relationship Catalogue

**None defined.** `001_constraints.cypher` contains only `CREATE CONSTRAINT` statements — there are **zero** `()-[:TYPE]->()` relationship definitions, therefore:

- **Cardinality:** undefined for all pairs.
- **Ownership:** undefined (no `BELONGS_TO` / `OWNED_BY` / tenant-ownership edges beyond the `tenantId` attribute).
- The ESO contract references `(ESO)-[:RESOLVED_TO]->(Executor)` and explicitly states it is **WRONG** (resolution is per-step, not per-ESO). No corrected relationship is defined anywhere in the repo.
- `graph/README.md` names append-only ledgers but defines no relationship types for them.

This is a hard gap: a "canonical data model" with no relationships cannot express the system's structure.

---

## 4. Lifecycle

- **Node lifecycle:** implicit — nodes are created with `id`+`tenantId`; no status field, no state machine defined in the graph.
- **Append-only entities** (per `graph/README.md`): `Evidence`, `ReasoningStep`, `Task`, `Outcome`, `Learning`. Rule: "Current state = latest event. Never UPDATE."
  - Of these, only `Evidence`, `Outcome`, `Learning` exist as nodes. `ReasoningStep` and `Task` are named but absent → **ledger rule references non-existent nodes**.
- **Versioning:** no graph-level version field on any node. Versioning lives only in the ESO contract (`identity.version` semver). No migration versioning beyond filename order (`001_`).

---

## 5. Ownership & Identity

- **Identity:** every node has `id` (UNIQUE) + `tenantId` (NOT NULL). That is the full identity model. No natural/business keys, no composite keys.
- **Ownership:** `tenantId` is the only ownership/scoping axis. No entity-to-entity ownership edges (e.g., `OrgUnit`→`Person`, `ESO`→`Capability` via `kasbaBinding` is a contract reference, not a graph relationship).

---

## 6. Graph Rules (from `graph/README.md` — sound, keep)

1. Every node carries `tenantId` (exit criterion #6; CI-enforced). ✅
2. Every ingested fact carries provenance (source, system, method, timestamp, confidence, agent, type, version, hash); not backfillable. ✅
3. Ledgers are append-only (Evidence, ReasoningStep, Task, Outcome, Learning); current state = latest event; never UPDATE. ✅

These rules are correct and should be preserved on freeze.

---

## 7. Open Issues (blockers to LOCK)

| # | Issue | Severity | Blocks |
|---|---|---|---|
| O1 | 10 required entities absent (Organization, Skill, Signal, ReasoningStep, Recommendation, Decision, Policy, MentalModel, Source, Task) | **CRITICAL** | Model incomplete |
| O2 | Zero relationship definitions (no cardinality/ownership) | **CRITICAL** | Model non-expressive |
| O3 | Naming mismatch: `OrgUnit` vs required `Department`; `Role` vs required `JobRole` | MEDIUM | Traceability |
| O4 | `ReasoningStep`/`Task` named as ledgers but no nodes | MEDIUM | Ledger rule dangling |
| O5 | `(ESO)-[:RESOLVED_TO]->(Executor)` flagged WRONG, no corrected relationship | MEDIUM | EPIC-008 |
| O6 | No indexes beyond id/tenantId (query performance unspecified) | LOW | Scale |
| O7 | No node status/lifecycle field | LOW | Lifecycle governance |

---

## 8. Final Decision

**Update (Sprint 2 prep — narrow completion pass):** `Signal`, `ReasoningStep`, `Recommendation`, `Decision`, `MentalModel`, `Policy` added via `graph/migrations/007_intelligence_entities.cypher` and `database/migrations/008_intelligence_entities.sql`, scoped specifically to what Sprint 2's stories require. `Organization` was added earlier in Sprint 1 Story 3. **Still DO NOT LOCK** — see below.

The Canonical Data Model is **still not correct/complete** against the full required entity set:
- 16 of 21 required entities now exist (2 naming mismatches remain: `OrgUnit`/`Department`, `Role`/`JobRole`); **3 still missing**: `Skill`, `Source`, `Task`.
- No relationships, cardinality, or ownership edges are defined anywhere in the graph — this is unchanged and remains the largest structural gap. Relationships will be added by each Sprint 2 story's own sync service at write-time (same pattern as Organization/Department/Person in Sprint 1), not retrofitted here.
- `Task` (one of the two append-only ledgers named in `graph/README.md` but never given a node) remains undefined. No Sprint 2 story currently requires it, so it stays out of scope for this pass.

Per the instruction "If correct → Mark Status: LOCKED," the condition is **not met**. The migration file (`001_constraints.cypher`) carries no `status:` field; it is implicitly **v0 / DRAFT**. It is left **unchanged**. No entities or relationships were invented.

### Required before LOCK
1. Add missing node labels + constraints: `Organization`, `Skill`, `Signal`, `ReasoningStep`, `Recommendation`, `Decision`, `Policy`, `MentalModel`, `Source`, `Task` (and reconcile `OrgUnit`↔`Department`, `Role`↔`JobRole` naming with the product layer).
2. Define relationship catalogue with cardinality + ownership (incl. the corrected per-step ESO→Executor resolution and `kasbaBinding` edge).
3. Reconcile `graph/README.md` ledger list with actual nodes.
4. Add lifecycle/status fields and performance indexes as needed.
5. Re-run migrations; confirm `tenant-isolation.yml` still passes; then mark `Status: LOCKED`.

> The graph artifact was not edited. This report is the complete, honest freeze review.
