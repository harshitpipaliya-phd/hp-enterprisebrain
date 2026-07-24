# EPIC-006 — Recommendation Engine

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Compose and **route** ESOs to address a case or signal, producing ranked, explainable recommendations. The Recommendation Engine turns reasoning (EPIC-005) into a proposed course of action that respects executor policy and trust ceilings.

## Business Problem

Knowing the root cause is not enough — the system must propose *which* ESO(s) to run, in what composition, and under what executor configuration. Without a recommendation layer, users are left manually assembling ESOs from the catalog, losing the composability the ESO model promises ("ESOs compose like functions": Leadership = Diagnose ∘ Prioritize ∘ Decide ∘ Communicate — Block 12).

## Business Value

- Turn diagnosis into a concrete, composable action plan.
- Respect `executorPolicy` (Block 5) — only recommend executors and trust levels the contract allows.
- Drive the Decision Center (EPIC-007) with ready-to-approve recommendations.

## Users

- **Case Owners** — receive and act on recommendations.
- **The Brain (system)** — generates recommendations.
- **Executors** — receive routed work.

## Features

- F-006.1 ESO catalog query against `trigger` (Block 2) + `gapTypes`.
- F-006.2 ESO composition using `lineage` (Block 12 `composedOf` / `composesInto`).
- F-006.3 Routing against `executorPolicy.routingCriteria` and `allowedExecutorClasses` (Block 5).
- F-006.4 Trust-ceiling enforcement (`trustLevels`, Block 5) — effective autonomy ≤ ceiling.
- F-006.5 Ranked, explainable recommendations with evidence backing.

## Dependencies

- EPIC-005 (Reasoning Engine) — selection logic.
- `contracts/eso/eso.schema.yaml` Blocks 2, 5, 12.
- `ai/` — routing/prompt assets.
- EPIC-001 (role → trust mapping).

## Required Data

- ESO contracts (full 12-block schema).
- Executor policy + trust levels (Block 5).
- Case context and allowed executor classes for the role.

## Screens

> Product planning only.

- Recommendation panel.
- ESO composition viewer.
- Routing / executor assignment preview.

## Acceptance Criteria

1. Recommendations only include ESOs whose `trigger.gapTypes` match the case/signal.
2. No recommendation proposes an executor class outside `allowedExecutorClasses` or a trust level above the ceiling (Block 5).
3. Composed recommendations respect `lineage` (Block 12) dependencies.
4. Each recommendation is scoped to `tenantId` and explains its evidence basis.

## Future Enhancements

- Learning-driven ranking (EPIC-009 outcome feedback).
- Autonomous recommendation execution under `autonomous` trust (EPIC-008).
- Recommendation marketplace across tenants (post-v1).

## Development Status

**Implemented.** Real and tested (3 tests) since Sprint 2, shown in the Intelligence Workspace screen.
