# Features

> Product feature specs for HP Enterprise Brain. This folder holds shippable, granular increments that roll up into the Epics in `development/epics/`.

## How features relate to Epics

Each feature file references its parent Epic and traces to engineering assets (`contracts/`, `graph/`, `api/`, `events/`, `ai/`). No field-level definitions are duplicated here — link to the contract.

| Feature prefix | Parent Epic | Title |
|---|---|---|
| F-001.x | EPIC-001 | Enterprise Workspace |
| F-002.x | EPIC-002 | Evidence Engine |
| F-003.x | EPIC-003 | Signal Engine |
| F-004.x | EPIC-004 | Case Engine |
| F-005.x | EPIC-005 | Reasoning Engine |
| F-006.x | EPIC-006 | Recommendation Engine |
| F-007.x | EPIC-007 | Decision Center |
| F-008.x | EPIC-008 | ESO Execution Engine |
| F-009.x | EPIC-009 | Learning Engine |

## Status

Feature specs are seeded from the `Features` sections of each Epic document. As of now, **EPIC-001 (Enterprise Workspace)** is fully expanded into feature specs:

| Feature | Title | Epic | Status |
|---|---|---|---|
| F-001.1 | Tenant Provisioning & Isolation Boundary | EPIC-001 | Planned |
| F-001.2 | Org Unit Hierarchy | EPIC-001 | Planned |
| F-001.3 | Person & Role Management | EPIC-001 | Planned |
| F-001.4 | Persona / Context Scoping | EPIC-001 | Planned |
| F-001.5 | Role-Based Access Gating ESO Trust Levels | EPIC-001 | Planned |

Remaining Epics (EPIC-002 → EPIC-009) are expanded as they enter grooming. See `development/roadmap/HP Enterprise Brain Development Roadmap.md` for the lifecycle.

## Conventions

- One feature per file, named `F-XXX.N-<slug>.md`.
- Every feature cites: parent Epic, target contract blocks / graph nodes / events / AI assets, acceptance criteria, and dependencies.
- This is product planning only — no UI, React, API, or DB authoring.
