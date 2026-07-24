# EPIC-008 — ESO Execution Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Execute **Executable Skill Objects** at runtime — orchestrating per-step executors (human | agent | software | hybrid), honoring the autonomy envelope, and performing the mandatory evidence write-back. The Execution Engine is where the contract-at-rest becomes the cognitive runtime in motion (§5.5).

## Business Problem

An ESO is a governed specification; it does nothing until executed. The system needs a runtime that walks `procedure.steps[]`, assigns each step to its `executorClass`, enforces `executorPolicy`, and guarantees the `evidenceHooks` write-back — without ever silently rewriting the procedure, exceeding trust, or skipping logging (§5.5). The Blueprint §6.3 per-ESO executor binding is incorrect; resolution is **per step** (§5.2).

## Business Value

- Turns approved recommendations (EPIC-007) into observable, accountable execution.
- Enforces the highest-value guarantees: autonomy bounds + evidence write-back (Principle P6).
- Compounds intelligence by feeding outcomes and learning (EPIC-009).

## Users

- **Executors** — human/agent/software performing steps.
- **Orchestrator (system)** — drives step execution.
- **Supervisors** — monitor execution, handle escalations (`escalationPath`, Block 5).

## Features

- F-008.1 Step orchestration over `procedure.steps[]` (Block 4) with per-step `executorClass`.
- F-008.2 Executor resolution per step (human | agent | software | hybrid) — NOT per ESO.
- F-008.3 Autonomy enforcement: effective autonomy ≤ `trustLevels` ceiling (Block 5).
- F-008.4 Mandatory evidence write-back via `evidenceHooks` (Block 9) — never skippable (§5.5).
- F-008.5 Escalation along `executorPolicy.escalationPath` (Block 5).
- F-008.6 Outcome emission to `Outcome` ledger (`graph/migrations/001_constraints.cypher`).

## Dependencies

- EPIC-007 (Decision Center) — execution trigger.
- `contracts/eso/eso.schema.yaml` Blocks 4 (procedure), 5 (executorPolicy), 9 (evidenceHooks), 1 (identity/version).
- `ai/` — agent executors, prompts, guardrails.
- `graph/` — `ESO`, `Executor`, `Outcome` nodes + `tenantId`.
- `events/` — `Task`/`Outcome` ledgers (`graph/README.md`).
- EPIC-002 (evidence write-back).

## Required Data

- ESO contract (full 12 blocks, especially 4/5/9).
- `ESO` (id, tenantId), `Executor` (id, tenantId), `Outcome` (id, tenantId) nodes.
- `mustLog` set: executor, context, artifacts, score, duration, exceptions (Block 9).
- Step execution traces (append-only).

## Screens

> Product planning only.

- Execution monitor / run view.
- Step executor assignment board (per-step classes).
- Escalation inbox.

## Acceptance Criteria

1. Each `procedure.steps[]` item is resolved to its own `executorClass` (per §5.2, not Blueprint §6.3).
2. Execution never exceeds the `trustLevels` ceiling and never skips `evidenceHooks` (§5.5) — CI/contract-checked.
3. Every execution emits the `mustLog` set to the Evidence Engine (Block 9).
4. All runtime state carries `tenantId`; outcomes are append-only.

## Future Enhancements

- Autonomous execution at `autonomous` trust (post-v1, gated by EPIC-007).
- Adaptive procedure selection within the authorized envelope (§5.5).
- Cross-ESO orchestration choreography (Block 12).

## Development Status

**Backend implemented, frontend missing.** Execution lifecycle (queued->running->completed/failed->rolled_back) real and tested (4 tests) since Sprint 2 — no execution-status UI yet.
