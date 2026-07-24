# FEP-001 — Actors

## Actors (Personas)

| Actor | Role in the Dashboard | Source |
|---|---|---|
| **Tenant Administrator** | Views whole-tenant health; configures dashboard scope; routes gaps to Cases/ESOs. | EPIC-001 Users; `Role` (F-001.3) |
| **Org Lead / Manager** | Views health of their `OrgUnit` subtree; assigns/acts within unit scope. | EPIC-001 Users; `SCR-Org-Unit-Tree.md` |
| **Individual Contributor** | Sees their own unit's health and linked development ESOs (per `memory.scope`, Block 11). | EPIC-001 Users |
| **Compliance Auditor** | Inspects health classifications and provenance; verifies no cross-tenant leakage. | `graph/README.md` provenance rule |
| **System (runtime aggregator)** | Reads tenant-scoped nodes; computes scores; classifies gaps. | `graph/` + `api/` |

> The dashboard is a *consumer* of EPIC-003/004/006/007/008/009 outputs. It introduces no new actor type.
