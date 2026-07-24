# EPIC-007 — Decision Center

> Product planning document. References engineering assets; does not modify them.

---

## Purpose

Provide the **human-in-the-loop governance** surface where people review, approve, reject, modify, delegate, schedule, or ignore system recommendations — operating strictly within the authorized autonomy envelope. The Decision Center is where bounded autonomy becomes a human choice.

## Business Problem

Autonomy must be earned and bounded. The trust ladder (`observe | suggest | approve | autonomous`, Block 5) means many actions require a human decision before execution. Without a dedicated decision surface, the system either over-automates (risk) or under-delivers (manual toil). The web `ESOCard` migration (TASK 16) already anticipates the six decision verbs.

## Business Value

- Safe governance: humans stay in control exactly at the trust levels the contract authorizes.
- Clear, auditable decision records feeding learning (EPIC-009) and outcomes (EPIC-008).
- The natural consumption point for recommendations (EPIC-006).

## Users

- **Decision Makers** — approve/reject/modify/delegate/schedule/ignore.
- **Case Owners** — review recommendations in context.
- **Auditors** — inspect decision history.

## Features

- F-007.1 Decision surface over recommendations (verbs: approve | reject | modify | delegate | schedule | ignore — per `web/MIGRATION.md`).
- F-007.2 Autonomy-gate enforcement: actions at `observe`/`suggest` require human decision; `autonomous` may self-execute (Block 5).
- F-007.3 Modification workflow that produces a **new ESO version** (§5.5: different behaviour ⇒ new version).
- F-007.4 Delegation to another executor/person within trust policy.
- F-007.5 Decision ledger (append-only, provenance-bearing).

## Dependencies

- EPIC-006 (Recommendation Engine) — input.
- `contracts/eso/eso.schema.yaml` Block 5 (`executorPolicy`, trust ladder) + Block 1 (`version`, `status`).
- `web/` — `ESOCard` consumes `ESOContract` (TASK 16) — design system never defines the contract.
- `events/` — decision ledger.

## Required Data

- Recommendations (from EPIC-006).
- Trust levels per executor (Block 5).
- Decision records: verb, actor, timestamp, resulting ESO version if modified.

## Screens

> Product planning only.

- Decision queue.
- ESOCard decision view (`onDecision` verbs from `web/MIGRATION.md`).
- Decision history / audit.

## Acceptance Criteria

1. The six decision verbs from `web/MIGRATION.md` are supported and routed correctly.
2. No action executes above its authorized trust level (Block 5) without a human decision.
3. A `modify` decision creates a new ESO `version` (§5.5) rather than mutating the published one.
4. Every decision is append-only and tenant-scoped.

## Future Enhancements

- Batch / bulk decisions.
- Delegated autonomous agents with escalating trust (post-v1).
- Decision quality analytics feeding trust calibration (EPIC-009).

## Development Status

**Implemented.** Approve/reject with executor resolution, real and tested (5 tests) since Sprint 2, shown in the Intelligence Workspace screen.
