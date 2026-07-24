# EPIC-005 — Reasoning Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Provide the **cognitive runtime** that interprets signals, cases, and ESO `gotchas` to produce reasoned conclusions and ESO selections. The Reasoning Engine animates the ESO "skeleton" (§5.5) within the envelope the contract authorizes.

## Business Problem

Detection (EPIC-003) and cases (EPIC-004) produce raw material, but the system still needs a reasoning faculty that (a) matches situations to ESOs, (b) interprets live signals against an ESO's known failure modes (`gotchas`), and (c) stays inside the contract's authorized envelope — never silently rewriting procedure, exceeding trust, or skipping evidence hooks (§5.5).

## Business Value

- Safe, auditable cognition that explains *why* it selected an ESO or flagged a risk.
- Direct use of the highest-signal ESO block — `gotchas` (Block 7) — to anticipate failure.
- The bridge between diagnosis (EPIC-004) and recommendation (EPIC-006).

## Users

- **The Brain (system)** — primary actor; reasons on behalf of users.
- **Reviewers** — inspect reasoning traces.
- **AI Engineers** — maintain prompts/guardrails (`ai/`).

## Features

- F-005.1 Situation → ESO matching using `trigger` (Block 2).
- F-005.2 Gotcha interpretation: map live signals to `gotchas[].detectionSignal`/`response` (Block 7).
- F-005.3 Reasoning-step ledger (append-only `ReasoningStep` per `graph/README.md`).
- F-005.4 Envelope enforcement: no procedure rewrite, no trust exceed, no skipped `evidenceHooks` (§5.5).
- F-005.5 Explainability: emit the reasoning trace behind each conclusion.

## Dependencies

- EPIC-003, EPIC-004 — inputs.
- `contracts/eso/eso.schema.yaml` Blocks 2 (trigger), 7 (gotchas), 9 (evidenceHooks), 5 (autonomy envelope).
- `ai/` — agents, prompts, guardrails (Ajit).
- `events/` — `ReasoningStep` ledger (`graph/README.md`).
- EPIC-002 (evidence for reasoning).

## Required Data

- ESO contract blocks referenced above.
- `ReasoningStep` ledger entries (append-only, provenance-bearing).
- Gotcha firings recorded with `gotchaId` (Block 7 requires stable ids the runtime reports).

## Screens

> Product planning only.

- Reasoning trace viewer.
- Gotcha firing log.
- Recommendation rationale panel.

## Acceptance Criteria

1. Reasoning traces are append-only and carry provenance (`graph/README.md`).
2. The runtime never rewrites ESO procedure, exceeds trust level, or skips `evidenceHooks` (§5.5) — verifiable against the contract.
3. Each conclusion cites the ESO `gotchaId`(s) and evidence that informed it.
4. All reasoning is scoped to `tenantId`.

## Future Enhancements

- Multi-step chained reasoning across composed ESOs (Block 12 `lineage`).
- Confidence-weighted reasoning under uncertainty.
- Human-overridable reasoning (links EPIC-007).

## Development Status

**Backend implemented, frontend embedded only.** Confidence computation (evidence corroboration x freshness) real and tested (4 tests) since Sprint 2 — shown only indirectly via Recommendation confidence, no standalone Reasoning trace view.
