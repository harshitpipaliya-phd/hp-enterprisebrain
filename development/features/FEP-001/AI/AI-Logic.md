# FEP-001 — AI Logic

> References the existing AI architecture (`ai/` — agents, prompts, guardrails, owner Ajit). Currently scaffolded (`.gitkeep`). Defines the AI inputs/outputs/rules the dashboard relies on. **No agents authored here** — `ai/` owns implementation.

## What the dashboard needs from AI
The dashboard is mostly a read/linkage surface, but its scoring and recommendation-ranking draw on three AI capabilities owned by other Epics:

1. **Signal detection (EPIC-003)** — produces the gaps the Gap Board shows; classified by the 8 families (`contracts/taxonomy/root-cause.schema.yaml`).
2. **Reasoning / scoring (EPIC-005)** — derives health states from `Evidence`/`Outcome`/`Learning`; interprets `gotchas` (Block 7) as risk notes; bounded by §5.5 envelope.
3. **Recommendation ranking (EPIC-006)** — ranks ESOs via `trigger.gapTypes` (Block 2) + `lineage` (Block 12).

## Prompt / Reasoning Inputs (consumed by the dashboard display)
- Per-unit `Evidence`/`Outcome`/`Learning` aggregates (with provenance).
- Open `Case`/`Hypothesis` + root-cause family.
- ESO `gotchas` (Block 7) that fired on related executions.

## Reasoning Outputs (displayed)
- Health state per unit/person/capability (healthy / watch / critical).
- Gap → family classification (must use the 8 families only).
- Recommended ESO list with match confidence.

## Confidence Rules
- Health confidence derives from `Evidence.confidence` + recency; low confidence → "watch" not "critical".
- Gap confidence comes from EPIC-003; the dashboard shows it, does not recompute.

## Human Approval Rules
- The dashboard never auto-acts. "Act" routes to EPIC-007, which enforces `executorPolicy.trustLevels` (Block 5): effective autonomy ≤ ceiling; `autonomous` may self-execute, lower levels require human decision.

## Learning Rules
- Reads `Outcome`/`Learning` (EPIC-009, append-only) to show calibration trends; does not write learning itself (writes happen via EPIC-007/008).

## Guardrail binding
- All AI outputs the dashboard displays respect the §5.5 envelope and Block 5 trust ladder — same guardrails EPIC-008 execution enforces.
