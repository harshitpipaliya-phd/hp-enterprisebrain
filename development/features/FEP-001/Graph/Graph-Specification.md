# FEP-001 — Graph Specification

> References the existing canonical model. The dashboard is **read-only**; it introduces **no new node labels and no new relationships**. This doc specifies the graph *reads* the dashboard performs and the missing entities it depends on downstream.

## Existing model it reads (do not change)
`graph/migrations/001_constraints.cypher` node labels, all `tenantId`-bound:
`Person`, `OrgUnit`, `Role`, `Capability`, `Evidence`, `Case`, `ESO`, `Executor`, `Outcome`, `Learning`, `Hypothesis`.

## Graph reads performed by the dashboard
- **Org-unit tree + roll-up:** `MATCH (u:OrgUnit {tenantId})-[*0..]->(child)` for scope subtree.
- **Health inputs:** `Evidence`, `Outcome`, `Learning` attached to units/people/capabilities in scope.
- **Gaps:** `Case`/`Hypothesis` open in scope, classified by root-cause family; plus EPIC-003 signal nodes when present.
- **ESO linkage:** `MATCH (e:ESO {tenantId}) WHERE e.trigger.gapTypes CONTAINS $family`.

## Dependencies on missing graph entities (downstream, not created here)
The dashboard consumes EPIC-003 **Signal** nodes and EPIC-005 **ReasoningStep** nodes. Per `reference/architecture/CANONICAL_MODEL_LOCK.md`, these labels are **missing** from `001_constraints.cypher`. Until added, the dashboard reads gaps from `Case`/`Hypothesis` and treats signals as an optional enhancement. This FEP does **not** add graph entities (per its read-only scope and the freeze review).

## Rules honored
- Every `MATCH` includes `tenantId` (CI-enforced).
- Reads never UPDATE; ledgers (`Evidence`, `Outcome`, `Learning`) are append-only (`graph/README.md`).
