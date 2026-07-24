# FEP-001 — ESO Actions

## ESO Action Layer (handoff only)

The dashboard **never executes** an ESO. It hands off to the governed execution path.

- **Affordance:** each linked ESO shows an "Act" control. Clicking it opens the Decision Center (EPIC-007) with the ESO pre-loaded.
- **Envelope enforcement (§5.5):** the handoff carries the ESO's `executorPolicy` (Block 5) so EPIC-007/008 enforce:
  - per-step `executorClass` (Block 4) resolution,
  - `trustLevels` ceiling (effective autonomy ≤ ceiling),
  - mandatory `evidenceHooks` write-back (Block 9).
- **Modify → new version:** if the operator modifies the ESO at decision time, EPIC-007 creates a new `version` (§5.5) rather than mutating the published one.
- **Per-context memory:** the ESO's `memory.scope` (Block 11) determines whether personalization is per-person or per-context during execution (EPIC-009).
- **Outcome:** execution emits `Outcome`/`Learning` (EPIC-009), which the dashboard later reads to update health.
