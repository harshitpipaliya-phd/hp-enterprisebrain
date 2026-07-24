# HP Enterprise Brain — Development Roadmap

> Master execution roadmap for the **Product Development Layer**.
> This document is the permanent control surface for product planning. It sits on top of the engineering repository and does **not** modify, duplicate, or supersede any engineering asset.

---

## 0. Relationship to the Engineering Repository

This is a **product planning layer** only. The engineering repository remains the authoritative foundation.

| Engineering asset | Owner | Authority | Reference from this layer |
|---|---|---|---|
| `contracts/` | Ajit | ESO schema, taxonomy, OpenAPI — **the hub** | Source of truth for all object shapes |
| `graph/` | Uma | Neo4j migrations, Cypher canonical model | Source of truth for the knowledge graph |
| `api/` | Vivek | Laravel — auth, tenancy, REST | Source of truth for service APIs |
| `ai/` | Ajit | agents, prompts, guardrails | Source of truth for AI behaviour |
| `events/` | Rajesh | outbox, append-only ledgers | Source of truth for the event ledger |
| `web/` | Frontend | React + design system | Consumer of all contracts |
| `infra/` | DevOps | terraform, CI, environments | Source of truth for deployment |
| `reference/` | Triz | glossary — GENERATED from `contracts/` | Generated vocabulary |

**The One Rule (from the repo root README) is in force here too:**
> `contracts/` is the ONLY source of truth. TypeScript and PHP types are GENERATED from it.

This layer **references** `contracts/`, `graph/`, `api/`, `events/`, `ai/`, and `reference/` by link. It never re-states field-level definitions. When a definition is needed, link to the contract.

---

## 1. Purpose

The Development Workspace exists to:

- Translate the HP Enterprise Brain vision into an ordered set of **Epics** and **Features**.
- Provide a single, permanent planning surface that product, design, and engineering can share.
- Keep product intent **traceable** to the contracts, graph model, API surface, and AI assets that implement it.
- Make progress visible without disturbing the engineering foundation (Sprint 1 is foundation-only — no business features).

This is **product planning only**. No UI, no React, no API endpoints, no database schemas are authored here. Those live in `web/`, `api/`, `graph/`, and `contracts/`.

---

## 2. Product Development Methodology

We use a **contract-first, evidence-driven** methodology that mirrors the engineering repo's "contracts are the hub" principle.

1. **Anchor in contracts.** Every Epic and Feature traces to a contract block, graph node/relationship, taxonomy family, or event ledger. If it cannot be traced, it is out of scope.
2. **Plan in Epics, deliver in Features.** Epics are long-lived capability areas. Features are shippable increments inside them.
3. **Reference, don't duplicate.** The ESO contract (`contracts/eso/eso.schema.yaml`), the root-cause taxonomy (`contracts/taxonomy/root-cause.schema.yaml`), the canonical graph model (`graph/migrations/001_constraints.cypher`), and the event ledgers (`events/`) are quoted by reference.
4. **Tenancy and provenance are non-negotiable.** Every planned capability assumes `tenantId` isolation (exit criterion #6 in `graph/README.md`) and append-only provenance on every fact (`graph/README.md` rules).
5. **Autonomy is bounded by the trust ladder.** Planning respects the `observe | suggest | approve | autonomous` trust model in `contracts/eso/eso.schema.yaml` Block 5 — we never plan for an executor to exceed its authorized ceiling.
6. **Acceptance criteria are machine-checkable where possible.** Following `contracts/eso/eso.schema.yaml` Block 8 (assessment), success must be observable.

---

## 3. Development Lifecycle

```
Discovery ──▶ Epic Definition ──▶ Feature Breakdown ──▶ Contract Alignment
     │                                                        │
     │                                                        ▼
     └──────────── Status Review ◀── Build ◀── Grooming ◀── Acceptance Planning
```

| Stage | Output | Where it lives |
|---|---|---|
| Discovery | Problem statements, signals | `development/roadmap/` (this doc) |
| Epic Definition | Epic docs | `development/epics/EPIC-0XX-*.md` |
| Feature Breakdown | Feature specs | `development/features/` |
| Contract Alignment | Link to `contracts/` blocks | inline references in each Epic/Feature |
| Acceptance Planning | Acceptance criteria | each Epic/Feature doc |
| Build | Engineering implementation | `api/`, `graph/`, `web/`, `ai/`, `events/` |
| Status Review | Status updates | `Development Status` section of each Epic + `Current Status` below |

**Open decisions that gate Epic completion** (carried from `contracts/eso/eso.schema.yaml` and `contracts/taxonomy/root-cause.schema.yaml`):

- **Objective enum conflict** — §5.2 (`DEVELOP|PERFORM|ASSESS|DECIDE`) vs Product Bible (`Assessment|Learning|Workflow|Communication`). Must be resolved before ESO schema is published.
- **Executor class granularity** — §5.2 binds `human|agent|software|hybrid` **per step**; Blueprint §6.3 binds per ESO. Adopt §5.2.
- **Autonomy model** — `trustLevel` (ceiling) vs DML `{floor, ceiling, gate}`. Recommend `trustLevel` = ceiling.
- **Memory block** — declaration vs storage. Recommend declaration only; state lives in the graph.
- **Root-cause vocabulary** — reconcile "eight families" numbering / "UODM" terminology added downstream vs the Product Bible's "root-cause taxonomy" / "Hypothesis Ledger".

These decisions are engineering-owned (Ajit/Uma). This layer tracks them but does not resolve them.

---

## 4. Epic List

| Epic | Title | Capability Area | Doc |
|---|---|---|---|
| EPIC-001 | Enterprise Workspace | Tenant, org, role, persona foundation | `development/epics/EPIC-001-Enterprise-Workspace.md` |
| EPIC-002 | Evidence Engine | Provenance, fact ingestion, ledgers | `development/epics/EPIC-002-Evidence-Engine.md` |
| EPIC-003 | Signal Engine | Gap/signal detection against taxonomy | `development/epics/EPIC-003-Signal-Engine.md` |
| EPIC-004 | Case Engine | Case lifecycle, hypothesis ledger | `development/epics/EPIC-004-Case-Engine.md` |
| EPIC-005 | Reasoning Engine | ESO runtime, gotcha interpretation | `development/epics/EPIC-005-Reasoning-Engine.md` |
| EPIC-006 | Recommendation Engine | ESO composition, routing | `development/epics/EPIC-006-Recommendation-Engine.md` |
| EPIC-007 | Decision Center | Human-in-the-loop approval | `development/epics/EPIC-007-Decision-Center.md` |
| EPIC-008 | ESO Execution Engine | Executable Skill Object execution | `development/epics/EPIC-008-ESO-Execution-Engine.md` |
| EPIC-009 | Learning Engine | Outcome/learning ledgers, compounding | `development/epics/EPIC-009-Learning-Engine.md` |

The nine Epics map cleanly onto the canonical graph nodes defined in `graph/migrations/001_constraints.cypher`
(`Person`, `OrgUnit`, `Role`, `Capability`, `Evidence`, `Case`, `ESO`, `Executor`, `Outcome`, `Learning`, `Hypothesis`)
plus the runtime faculties implied by the ESO contract Blocks 4–12.

---

## 5. Current Status

| Item | State |
|---|---|
| Engineering foundation (Sprint 1) | **Complete** — foundation only, no business features |
| Contracts hub | ESO schema v1.0.0-**DRAFT** (awaiting architecture sign-off); root-cause taxonomy v1.0.0 published |
| Graph canonical model | v0 constraints migrated; `tenantId` + provenance rules enforced |
| API / Events / AI / Reference / Infra | scaffolded (`.gitkeep`), not yet implemented |
| Web | design system scaffolded; `ESOCard` migration queued (TASK 16) |
| Product layer (this folder) | **Newly established** with this roadmap + 9 Epics |

All Epics below are at **Development Status: Planned** unless otherwise noted.

---

## 6. Future Releases

| Release | Theme | Epics in scope |
|---|---|---|
| R1 — Foundation | Tenancy, identity, evidence ingestion, graph baseline | EPIC-001, EPIC-002 |
| R2 — Diagnostic | Signals, cases, hypotheses, root-cause classification | EPIC-003, EPIC-004 |
| R3 — Cognition | ESO runtime, reasoning, recommendations | EPIC-005, EPIC-006 |
| R4 — Governance | Human approval, bounded autonomy, execution | EPIC-007, EPIC-008 |
| R5 — Compounding | Outcome/learning ledgers, personalization | EPIC-009 |
| R6+ — Scale | Cross-tenant analytics, marketplace of ESOs, autonomous operations | all (post-v1) |

Release boundaries are indicative; Epics may overlap releases as the contracts reach sign-off.

---

*This roadmap is the permanent development workspace control surface. It is edited as Epics progress; the engineering repository under it is never modified by this layer.*
