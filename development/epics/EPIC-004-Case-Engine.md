# EPIC-004 — Case Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Manage the **case lifecycle** — from a detected signal through hypothesis formation, investigation, and resolution — including the append-only Hypothesis Ledger that classifies each hypothesis against the root-cause taxonomy. The Case Engine is the investigative thread that ties signals to decisions.

## Business Problem

A signal alone is not actionable. Organizations need a managed investigative process: a case that captures the situation, proposes and tests hypotheses, and records why a particular root cause was concluded. Without a case construct, reasoning becomes ad hoc and untraceable.

## Business Value

- Structured, auditable investigation of every significant gap.
- A Hypothesis Ledger that makes diagnostic reasoning inspectable and reusable.
- The case graph node that ESOs, evidence, and outcomes attach to (`graph/migrations/001_constraints.cypher` defines `Case` and `Hypothesis`).

## Users

- **Case Owners / Investigators** — drive the investigation.
- **Reviewers** — audit hypothesis reasoning.
- **The Brain (system)** — reads case state to route ESOs and record outcomes.

## Features

- F-004.1 Case creation from signals (EPIC-003).
- F-004.2 Hypothesis formulation and ledger (`Hypothesis` node, append-only).
- F-004.3 Hypothesis classification against root-cause families (`contracts/taxonomy/root-cause.schema.yaml`).
- F-004.4 Case state machine (open → investigating → hypothesized → resolved → closed).
- F-004.5 Case ↔ Evidence ↔ ESO linkage.

## Dependencies

- EPIC-003 (Signal Engine) — case origin.
- EPIC-002 (Evidence Engine) — hypothesis support evidence.
- `graph/migrations/001_constraints.cypher` — `Case`, `Hypothesis` node constraints + `tenantId`.
- `events/` — append-only ledgers (Rajesh).
- `contracts/taxonomy/root-cause.schema.yaml` — classification.

## Required Data

- `Case` (id, tenantId) and `Hypothesis` (id, tenantId) per `graph/migrations/001_constraints.cypher`.
- Hypothesis → root-cause family mapping.
- Case lifecycle events (append-only).

## Screens

> Product planning only.

- Case list / queue.
- Case workspace (signal, hypotheses, evidence).
- Hypothesis ledger view.

## Acceptance Criteria

1. A case can be opened from any signal and carries its `tenantId`.
2. Every hypothesis is recorded append-only and classified against the eight families.
3. Case state transitions are logged as events (`events/`).
4. The case links to the evidence and ESOs that produced its conclusions.

## Future Enhancements

- Collaborative investigation (multiple investigators).
- Hypothesis similarity / reuse across cases.
- Automated hypothesis generation via Reasoning Engine (EPIC-005).

## Development Status

**Implemented.** `Case`/`Hypothesis` graph constraints existed since before Sprint 1; lifecycle and ledger built in the HP Enterprise Brain MVP pass — `database/migrations/016_case_engine.sql`, `api/src/case/`, 7 tests in `api/tests/case-engine.test.ts`. F-004.1 through F-004.5 all implemented. Not yet verified against a live database — see the repository's standing limitation on this across every prior sprint.
