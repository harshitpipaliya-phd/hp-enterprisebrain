# FEP-001 — Release Notes

## Release: Organization Health Dashboard (FEP-001)

**Epic:** EPIC-001 Enterprise Workspace
**Type:** Read-only observability surface (no contract/graph/ADR changes)
**Status:** Feature Engineering Package complete; awaiting Sprint build of `api/`, `events/`, `ai/` scaffolds.

### Included in this package
- Narrative: Problem, BusinessGoal, BusinessFlow, BusinessRules, Actors, Permissions, DataSources, BusinessAnalysis.
- Intelligence: Evidence, Signals, Reasoning, Recommendations, ESOActions, Learning, IntelligenceLogic (end-to-end flow).
- UI: UI-Specification, Widget-Specification, Wireframe-Specification, Prototype-Mapping.
- Engineering specs: API-Specification, Graph-Specification, AI-Logic.
- Quality: AcceptanceCriteria, Functional-Tests, Business-Tests, Acceptance-Tests.
- This file: Release-Notes.

### What it delivers
A tenant-scoped dashboard that aggregates health across `OrgUnit`/`Person`/`Role`/`Capability` and presents gaps on an 8-family root-cause board, each linked to a `Case` or a contract-validated ESO (`trigger.gapTypes`). Actions are trust-gated (Block 5) and handed off to EPIC-007/008.

### Dependencies (scaffolded, must be built)
- `api/` — health read endpoints.
- EPIC-003 (Signal Engine) — produces the gaps shown on the board.
- EPIC-004 (Case Engine) — supplies linked Cases/Hypotheses.
- EPIC-006/007/008 — recommendation ranking, decision, execution handoff.
- EPIC-009 (Learning) — `Outcome`/`Learning` calibration feed.

### Known constraints / open items
- **Missing graph entities:** EPIC-003 `Signal` and EPIC-005 `ReasoningStep` nodes are absent from `001_constraints.cypher` (see `reference/architecture/CANONICAL_MODEL_LOCK.md`). Dashboard reads gaps from `Case`/`Hypothesis` until those land.
- **Engineering Blueprint / Product Bible:** referenced by other docs but not in-repo; this FEP relies only on in-repo artifacts (`contracts/`, `graph/`, CI).
- **ESO contract** remains DRAFT/LOCK-pending (see `reference/contracts/ESO_LOCK_REPORT.md`); dashboard consumes the generated `ESOContract` types as-is.

### Migration / breaking changes
- None. The package adds no nodes, relationships, endpoints schema, or contract fields.
