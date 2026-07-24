# EPIC-009 — Learning Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Capture **outcomes and learning** as append-only ledgers and use them to compound organizational intelligence — improving ESO selection, trust calibration, and personalization over time. The Learning Engine closes the loop: execution (EPIC-008) produces outcomes; outcomes produce learning; learning improves future reasoning and recommendations.

## Business Problem

Intelligence that does not learn decays. Without a learning substrate, the system repeats mistakes, never calibrates executor trust, and cannot personalize to a person or context. The ESO contract anticipates this with `memory` (Block 11) and `lineage.sourceEvidence` (Block 12), but state must live in the graph, not in the versioned contract (recommended decision in `contracts/eso/eso.schema.yaml`).

## Business Value

- Compounding intelligence (Principle P6) — every execution makes the next smarter.
- Calibrated autonomy: trust levels improve from observed outcomes.
- Longitudinal personalization per person/context (Block 11 `memory.scope`).

## Users

- **The Brain (system)** — consumes learning to improve.
- **AI Engineers** — tune learning from `Outcome`/`Learning` ledgers.
- **Leadership** — view organizational learning trends.

## Features

- F-009.1 Outcome ledger (`Outcome` node, append-only — `graph/migrations/001_constraints.cypher`).
- F-009.2 Learning ledger (`Learning` node, append-only).
- F-009.3 Trust calibration: adjust `executorPolicy.trustLevels` from outcomes (Block 5).
- F-009.4 Personalization: per-person/per-context memory reads (`memory` Block 11) sourced from graph.
- F-009.5 Learning → ESO `lineage.sourceEvidence` feedback (Block 12).

## Dependencies

- EPIC-008 (ESO Execution Engine) — outcome source.
- `graph/migrations/001_constraints.cypher` — `Outcome`, `Learning` nodes + `tenantId`.
- `events/` — append-only ledgers (`graph/README.md`).
- `contracts/eso/eso.schema.yaml` Blocks 5, 11, 12.
- EPIC-006 (recommendation ranking feed).

## Required Data

- `Outcome` (id, tenantId), `Learning` (id, tenantId) per `graph/migrations/001_constraints.cypher`.
- Outcome → ESO + executor + score linkage.
- Per-person/context memory state (declared in Block 11, stored in graph per recommended decision).

## Screens

> Product planning only.

- Organizational learning dashboard.
- Trust calibration view.
- Personalization / memory inspector.

## Acceptance Criteria

1. Outcomes and learning are append-only and provenance-bearing (`graph/README.md`).
2. Learning feeds back into ESO selection/ranking (EPIC-006) and trust calibration (Block 5).
3. Per-person memory is declared in the ESO `memory` block but stored in the graph (per recommended decision in `contracts/eso/eso.schema.yaml`).
4. All learning is `tenantId`-scoped.

## Future Enhancements

- Cross-case learning transfer.
- Automated ESO improvement proposals (new versions via EPIC-007).
- Federated learning across tenants (post-v1, privacy-gated).

## Development Status

**Implemented.** DPDP-anonymized learning capture plus Pattern Detection (frequency clustering), real and tested, shown in the Intelligence Workspace and Executive Dashboard screens.
