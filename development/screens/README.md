# Screens

> Product screen inventory for HP Enterprise Brain. **Intent only — no UI, no React, no design implementation.**

This folder captures the *purpose and content* of each product screen so that the `web/` design system can later consume the contracts and build them. Per `web/MIGRATION.md`, the design system **consumes** the contract (`ESOContract`) and never defines it.

## Screen → Epic map

| Screen file | Realizes | Epic | Engineering reference |
|---|---|---|---|
| `SCR-Tenant-Home.md` | F-001.1 | EPIC-001 | `graph/` all nodes `tenantId`; `.github/workflows/tenant-isolation.yml` |
| `SCR-Org-Unit-Tree.md` | F-001.2 | EPIC-001 | `graph/` `OrgUnit` |
| `SCR-User-Directory.md` | F-001.3 | EPIC-001 | `graph/` `Person`/`Role` |
| `SCR-Role-Persona-Management.md` | F-001.4, F-001.5 | EPIC-001 | `contracts/eso` Blocks 5 & 11; `graph/` `Role`/`Person`/`OrgUnit`/`ESO`/`Executor` |
| Evidence ledger / stream | EPIC-002 | `graph/` `Evidence` + `events/` |
| Provenance trace | EPIC-002 | `graph/README.md` provenance rule |
| Signal dashboard | EPIC-003 | `contracts/taxonomy/root-cause.schema.yaml` |
| Case list / queue | EPIC-004 | `graph/` `Case` |
| Hypothesis ledger | EPIC-004 | `graph/` `Hypothesis` |
| Reasoning trace viewer | EPIC-005 | `events/` `ReasoningStep` |
| Recommendation panel | EPIC-006 | `contracts/eso` Blocks 2/5/12 |
| Decision queue / ESOCard | EPIC-007 | `web/MIGRATION.md` `onDecision` verbs |
| Execution monitor | EPIC-008 | `contracts/eso` Blocks 4/5/9 |
| Learning dashboard | EPIC-009 | `graph/` `Outcome`/`Learning` |

> EPIC-001 screens are fully specified. Remaining Epics are specified as their features are expanded.

## Conventions

- One screen per file, named `SCR-<slug>.md`.
- Each screen doc includes: Purpose, Users, Widgets, Components, Business Rules, Navigation, Actions, Error States, Loading States, Empty States, Permissions, Related APIs, Related Graph Nodes, Related AI Logic, Acceptance Criteria.
- Detailed wireframes live in `development/wireframes/`.
