# FEP-001 — Business Rules

## Business Rules

1. **Tenant scoping is mandatory.** Every read behind the dashboard is filtered by the operator's `tenantId` (exit criterion #6, `graph/README.md`); the CI guard (`.github/workflows/tenant-isolation.yml`) fails any `MATCH` without it.
2. **Read-only by default.** The dashboard does not mutate entities; it links to EPIC-004/007/008 for writes.
3. **Org-unit scope inheritance.** Selecting an `OrgUnit` scopes the view to that unit and its descendants (`SCR-Org-Unit-Tree.md` tree rule).
4. **Root-cause classification is fixed.** Gaps are classified only against the 8 families in `contracts/taxonomy/root-cause.schema.yaml` (Capability, Capacity, Process, Information, Motivation, Coordination, External, Policy). No new families invented.
5. **ESO linkage via contract.** A gap links to an ESO only when the ESO's `trigger.gapTypes` (Block 2) matches the gap's family.
6. **Autonomy envelope respected.** Any "act" affordance routes through EPIC-007/008 and honors `executorPolicy.trustLevels` (Block 5) — the dashboard never executes beyond the ceiling.
7. **Provenance on every fact.** All underlying data carries provenance per `graph/README.md` (source, system, method, timestamp, confidence, agent, type, version, hash); the dashboard shows provenance on demand.
8. **No cross-tenant visibility.** The dashboard cannot display another tenant's nodes.
