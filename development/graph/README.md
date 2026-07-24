# Graph (Product Layer)

> Product view of the knowledge graph. **Planning only — no migrations authored here.**

The authoritative graph model and migrations live in `graph/` (owner Uma). `graph/migrations/001_constraints.cypher` defines the canonical node constraints. This folder maps product capabilities to graph nodes/relationships so product planning stays traceable to the model.

## Canonical nodes (from `graph/migrations/001_constraints.cypher`)

Every node carries `id` + `tenantId` (mandatory — exit criterion #6). Product Epics map as follows:

| Node | Epic(s) | Notes |
|---|---|---|
| `Person` | EPIC-001 | identity |
| `OrgUnit` | EPIC-001 | org hierarchy |
| `Role` | EPIC-001 | role → trust mapping |
| `Capability` | EPIC-001/006 | KASBA binding target (`contracts/eso` Block 1 `kasbaBinding`) |
| `Evidence` | EPIC-002 | append-only, full provenance |
| `Case` | EPIC-004 | investigative thread |
| `ESO` | EPIC-005/006/008 | Executable Skill Object |
| `Executor` | EPIC-007/008 | per-step resolution (§5.2), not per-ESO |
| `Outcome` | EPIC-009 | append-only ledger |
| `Learning` | EPIC-009 | append-only ledger |
| `Hypothesis` | EPIC-004 | root-cause classified |

## Graph rules in force (from `graph/README.md`)

- Every node carries `tenantId`; CI fails Cypher without it.
- Every ingested fact carries provenance (source, system, method, timestamp, confidence, agent, type, version, hash) — not backfillable.
- Ledgers are append-only (Evidence, ReasoningStep, Task, Outcome, Learning); current state = latest event.

## KASBA binding

ESOs bind to exactly one graph node of type `Knowledge | Ability | Skill | Attitude | Behaviour | Task | Role | Capability` (`contracts/eso` Block 1). Product planning treats these as the skill ontology backbone.

## Conventions

- This folder holds product→graph mappings, not Cypher.
- Migrations belong in `graph/migrations/`.
- Every mapping cites the relevant Epic and the node from `001_constraints.cypher`.
