# FEP-001 — Organization Health Dashboard

> Feature Engineering Package. Implements the **Organization Health Dashboard** (EPIC-001 Enterprise Workspace).
> Built on top of the existing repository. References authoritative engineering assets; does NOT modify contracts, graph models, ADRs, or architecture.

---

## Package Contents

```
FEP-001/
├── README.md              # this file — package overview
├── Problem.md             # problem statement
├── BusinessGoal.md        # business goal
├── BusinessFlow.md        # business workflow
├── BusinessRules.md       # business rules
├── Actors.md              # actors / personas
├── Permissions.md         # permission model
├── DataSources.md         # internal + external data sources
├── Evidence.md            # evidence layer
├── Signals.md             # signal layer
├── Reasoning.md           # reasoning layer
├── Recommendations.md     # recommendation layer
├── ESOActions.md          # ESO action layer
├── Learning.md            # learning layer
├── IntelligenceLogic.md   # end-to-end intelligence flow (links above)
├── AcceptanceCriteria.md  # acceptance criteria
├── Dependencies.md        # dependencies & open decisions
├── BusinessAnalysis.md    # KPIs / success metrics
├── UI/
│   ├── UI-Specification.md
│   ├── Widget-Specification.md
│   ├── Wireframe-Specification.md
│   └── Prototype-Mapping.md
├── API/API-Specification.md
├── Graph/Graph-Specification.md
├── AI/AI-Logic.md
├── Tests/
│   ├── Functional-Tests.md
│   ├── Business-Tests.md
│   └── Acceptance-Tests.md
└── Release-Notes.md
```

## Traceability

- Epic: `development/epics/EPIC-001-Enterprise-Workspace.md`
- Screen: `development/screens/SCR-Org-Unit-Tree.md` (the structural surface the dashboard rolls up from); Tenant Home (`SCR-Tenant-Home.md`) is the container.
- Contracts: `contracts/eso/eso.schema.yaml` (Blocks 4 procedure, 5 executorPolicy/trustLevels, 7 gotchas, 9 evidenceHooks, 11 memory); `contracts/taxonomy/root-cause.schema.yaml` (8 families).
- Graph: `graph/migrations/001_constraints.cypher` (`Person`, `OrgUnit`, `Role`, `Capability`, `Evidence`, `Case`, `ESO`, `Executor`, `Outcome`, `Learning`, `Hypothesis`) — all `tenantId`-bound.
- Events: `events/` (ledgers — scaffold).
- AI: `ai/` (agents/guardrails — scaffold).
- CI: `.github/workflows/tenant-isolation.yml`, `.github/workflows/contracts.yml`.

## Purpose of this Feature

The Organization Health Dashboard is the **observability surface** of EPIC-001. It aggregates tenant-scoped signals across org units, people, roles, capabilities, cases, and ESOs into a single health view, classifies gaps against the eight root-cause families, and routes the user to the right ESO or case. It is the entry point where diagnostic intelligence (EPIC-003/004) and recommendations (EPIC-006) become visible to a human operator.

## Build Readiness

Implementation-ready from a planning standpoint: every widget, API, graph read, and AI rule traces to an existing artifact. The dashboard is **read-centric** — it consumes existing nodes and emits no new contract; it depends on scaffolded `api/`, `events/`, `ai/` for live data, but the spec is complete.
