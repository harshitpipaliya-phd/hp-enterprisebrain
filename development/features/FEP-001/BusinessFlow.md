# FEP-001 — Business Workflow

## Business Workflow

1. **Entry** — Operator (Tenant Administrator / Org Lead) lands on the dashboard within their active tenant (`SCR-Tenant-Home.md` → Organization Health).
2. **Scope selection** — Operator picks the org unit scope (whole tenant, a division, or a team) using the `OrgUnit` tree (`SCR-Org-Unit-Tree.md`).
3. **Aggregation** — The dashboard reads tenant-scoped nodes (`OrgUnit`, `Person`, `Role`, `Capability`, `Case`, `Evidence`, `ESO`, `Outcome`, `Learning`) and the signals/cases derived from them (EPIC-003/004).
4. **Health scoring** — Entities are scored into health states (healthy / watch / critical) from their attached Evidence/Outcome/Learning.
5. **Gap classification** — Open gaps/signals are classified against the 8 root-cause families (`contracts/taxonomy/root-cause.schema.yaml`).
6. **Recommendation linkage** — Each gap is linked to a candidate ESO via `trigger.gapTypes` (Block 2) and/or an open `Case`/`Hypothesis`.
7. **Action routing** — Operator drills into a gap → opens the linked Case (EPIC-004) or triggers the recommended ESO through the Decision Center (EPIC-007) / Execution Engine (EPIC-008).
8. **Feedback** — Outcomes of acted-on gaps write back to `Outcome`/`Learning` (EPIC-009), improving future scoring.

## Flow actors

- Operator (Tenant Administrator / Org Lead) — primary user.
- System (read aggregation, scoring, classification).
- Downstream Epics (003 Signal, 004 Case, 006 Recommendation, 007 Decision, 008 Execution, 009 Learning) — produce the data the dashboard consumes.

## Entry / Exit

- **Entry:** authenticated operator within a tenant.
- **Exit:** operator routes from a gap to a Case or ESO action (handoff, not execution).
