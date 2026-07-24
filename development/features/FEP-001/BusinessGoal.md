# FEP-001 — Business Goal

## Business Goal

Provide a single, tenant-scoped **Organization Health Dashboard** that aggregates signals across organizational entities, classifies organizational gaps against the eight root-cause families, and connects each gap to the ESO or case that can address it — within the authorized autonomy envelope.

## Success Definition

An operator opens the dashboard for their tenant and sees:
- Org-unit health roll-ups (from `OrgUnit` tree, `SCR-Org-Unit-Tree.md`).
- A gap/signal board classified by the 8 root-cause families (`contracts/taxonomy/root-cause.schema.yaml`).
- Each gap linked to a recommended ESO (Block 2 `trigger.gapTypes`) or an open Case (`Case`/`Hypothesis` nodes).
- All data scoped by `tenantId` (exit criterion #6).

## Non-Goals (explicit)

- Does not create org units, people, or roles — those are F-001.2 / F-001.3.
- Does not itself detect signals — EPIC-003 does; the dashboard **consumes** signals.
- Does not decide/execute — EPIC-007 (Decision Center) and EPIC-008 (Execution) own those; the dashboard links to them.
- Does not modify the ESO contract, graph model, or any ADR.
