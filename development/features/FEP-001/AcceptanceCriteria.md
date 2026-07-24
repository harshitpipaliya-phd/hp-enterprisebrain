# FEP-001 — Acceptance Criteria

## Acceptance Criteria

1. **Tenant-scoped health view.** An operator sees organizational health only for their `tenantId`; all reads include `tenantId` and pass the CI guard (`.github/workflows/tenant-isolation.yml`, exit criterion #6).
2. **Org-unit scoping.** Selecting an `OrgUnit` scopes the dashboard to that unit and its descendants (`SCR-Org-Unit-Tree.md`); cross-unit leakage is impossible.
3. **Root-cause classification.** Every gap on the board is classified against the 8 families in `contracts/taxonomy/root-cause.schema.yaml`; no other families appear.
4. **ESO linkage by contract.** A gap links only to ESOs whose `trigger.gapTypes` (Block 2) matches the gap's family; linkage rule reuses the contract.
5. **Trust-gated actions.** The "Act" affordance is disabled when the operator's effective autonomy (F-001.5 / Block 5 `trustLevels`) is below the ESO's ceiling; handoff goes to EPIC-007, never direct execution.
6. **Read-only dashboard.** The dashboard performs no mutations; writes happen only via EPIC-004/007/008 handoffs.
7. **Provenance visible.** Each health score / gap links to its underlying `Evidence` with full provenance (`graph/README.md`).
8. **No contract/graph/ADR modification.** This FEP adds no node labels, relationships, or contract fields; it consumes existing artifacts only.

## Definition of Done
- `api/` health read endpoints implemented and tested (FT-01..04).
- Dashboard UI renders health overview + 8-family gap board + detail drawer (`UI/*`).
- ESO linkage and trust-gating verified against `ESOContract` (Block 2/5).
- Tests in `Tests/` pass (functional, business, acceptance).
